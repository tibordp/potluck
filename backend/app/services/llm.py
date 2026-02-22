import base64
import io
import re
from html.parser import HTMLParser

import anthropic
import httpx
from PIL import Image

from ..config import settings
from ..schemas import ParsedIngredient, ParsedRecipe


class _HTMLTextExtractor(HTMLParser):
    """Strip HTML to plain text, skipping script/style/nav/header/footer."""

    _SKIP_TAGS = frozenset(
        ["script", "style", "nav", "header", "footer", "noscript", "svg", "iframe"]
    )

    def __init__(self) -> None:
        super().__init__()
        self._chunks: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self._SKIP_TAGS:
            self._skip_depth += 1
        elif tag in ("br", "p", "div", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6"):
            if self._skip_depth == 0:
                self._chunks.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in self._SKIP_TAGS:
            self._skip_depth = max(0, self._skip_depth - 1)

    def handle_data(self, data: str) -> None:
        if self._skip_depth == 0:
            self._chunks.append(data)

    def get_text(self) -> str:
        text = "".join(self._chunks)
        # Collapse whitespace runs but preserve single newlines
        text = re.sub(r"[^\S\n]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()


# Claude's limit is 5 MB on the base64-encoded payload.
# Base64 inflates by ~4/3, so raw bytes must stay under 5 * 3/4 ≈ 3.75 MB.
MAX_IMAGE_BYTES = 3_750_000

RECIPE_PARSE_TOOL = {
    "name": "save_parsed_recipe",
    "description": "Save the parsed recipe data",
    "input_schema": {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Recipe name in English"},
            "description": {
                "type": "string",
                "description": "Short description in English",
            },
            "servings": {"type": "integer", "description": "Number of servings"},
            "prep_time_minutes": {
                "type": "integer",
                "description": "Prep time in minutes",
            },
            "cook_time_minutes": {
                "type": "integer",
                "description": "Cook time in minutes",
            },
            "instructions": {
                "type": "string",
                "description": (
                    "Step-by-step instructions in English, "
                    "split into clear numbered steps separated by newlines"
                ),
            },
            "tags": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Tags like quick, italian, vegetarian, etc.",
            },
            "freezable": {
                "type": "boolean",
                "description": "true if this recipe is commonly batch-cooked and frozen",
            },
            "ingredients": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Ingredient name in English, lowercase",
                        },
                        "amount": {"type": "number", "description": "Numeric amount"},
                        "unit": {
                            "type": "string",
                            "description": "Unit: g, ml, piece, tbsp, tsp, cup, etc.",
                        },
                    },
                    "required": ["name", "amount", "unit"],
                },
            },
        },
        "required": ["name", "servings", "instructions", "ingredients"],
    },
}


def html_to_text(html: str) -> str:
    """Extract readable text from HTML, stripping scripts, styles, and boilerplate."""
    extractor = _HTMLTextExtractor()
    extractor.feed(html)
    return extractor.get_text()


async def fetch_url_content(url: str) -> str:
    async with httpx.AsyncClient(follow_redirects=True, timeout=30) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        return html_to_text(resp.text)


async def parse_recipe_text(
    text: str,
    existing_ingredients: list[str],
    source_url: str | None = None,
) -> ParsedRecipe:
    client = anthropic.Anthropic(api_key=settings.potluck_anthropic_api_key)

    ingredient_list = "\n".join(f"- {name}" for name in existing_ingredients)
    system_prompt = (
        "You are a recipe parser. Extract recipe information from the provided text. "
        "Translate everything to English if it's in another language. "
        "Use the save_parsed_recipe tool to return the structured data.\n\n"
        "For instructions, format them as clearly numbered steps "
        "(e.g. '1. ...\\n2. ...'), one step per line. "
        "Group related actions into sensible paragraphs separated by blank lines "
        "(e.g. prep, cooking, finishing). "
        "Add step numbers and paragraph breaks even if the original "
        "text lacks them.\n\n"
        "For ingredient names, try to match these existing ingredients "
        "when possible (use the exact name if it matches):\n"
        f"{ingredient_list}\n\n"
        "If an ingredient doesn't match any existing one, "
        "use a clear, simple English name in lowercase."
    )

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=system_prompt,
        tools=[RECIPE_PARSE_TOOL],
        messages=[{"role": "user", "content": f"Parse this recipe:\n\n{text}"}],
    )

    # Extract tool use result
    for block in response.content:
        if block.type == "tool_use" and block.name == "save_parsed_recipe":
            return _build_recipe_from_tool_call(block.input, existing_ingredients, source_url)

    raise ValueError("LLM did not return structured recipe data")


def _build_recipe_from_tool_call(
    data: dict,
    existing_ingredients: list[str],
    source_url: str | None = None,
) -> ParsedRecipe:
    ingredients = [
        ParsedIngredient(
            name=ing["name"],
            amount=ing["amount"],
            unit=ing["unit"],
        )
        for ing in data.get("ingredients", [])
    ]

    return ParsedRecipe(
        name=data["name"],
        description=data.get("description"),
        servings=data.get("servings", 4),
        prep_time_minutes=data.get("prep_time_minutes"),
        cook_time_minutes=data.get("cook_time_minutes"),
        instructions=data.get("instructions", ""),
        tags=data.get("tags", []),
        freezable=data.get("freezable", False),
        source_url=source_url,
        ingredients=ingredients,
    )


def _compress_image(image_data: bytes, max_bytes: int = MAX_IMAGE_BYTES) -> tuple[bytes, str]:
    """Resize and compress an image to fit under max_bytes. Returns (data, media_type)."""
    if len(image_data) <= max_bytes:
        # Detect format without re-encoding
        with Image.open(io.BytesIO(image_data)) as img:
            fmt = (img.format or "JPEG").upper()
        mime = {"JPEG": "image/jpeg", "PNG": "image/png", "GIF": "image/gif", "WEBP": "image/webp"}
        return image_data, mime.get(fmt, "image/jpeg")

    img = Image.open(io.BytesIO(image_data))
    img.load()

    # Convert to RGB if needed (e.g. RGBA PNGs)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    # Progressively downscale until it fits
    quality = 85
    for scale in [1.0, 0.75, 0.5, 0.35, 0.25]:
        w, h = int(img.width * scale), int(img.height * scale)
        resized = img.resize((w, h), Image.LANCZOS) if scale < 1.0 else img

        buf = io.BytesIO()
        resized.save(buf, format="JPEG", quality=quality, optimize=True)
        if buf.tell() <= max_bytes:
            return buf.getvalue(), "image/jpeg"

        # Try lower quality at this scale
        for q in [70, 50]:
            buf = io.BytesIO()
            resized.save(buf, format="JPEG", quality=q, optimize=True)
            if buf.tell() <= max_bytes:
                return buf.getvalue(), "image/jpeg"

    # Last resort: very small
    resized = img.resize((800, int(800 * img.height / img.width)), Image.LANCZOS)
    buf = io.BytesIO()
    resized.save(buf, format="JPEG", quality=40, optimize=True)
    return buf.getvalue(), "image/jpeg"


async def parse_recipe_image(
    image_data: bytes,
    media_type: str,
    existing_ingredients: list[str],
) -> ParsedRecipe:
    image_data, media_type = _compress_image(image_data)

    client = anthropic.Anthropic(api_key=settings.potluck_anthropic_api_key)

    ingredient_list = "\n".join(f"- {name}" for name in existing_ingredients)
    system_prompt = (
        "You are a recipe parser. Extract recipe information from the provided image of a recipe. "
        "The image may be a photo of a cookbook page, a handwritten recipe, a screenshot, etc. "
        "Translate everything to English if it's in another language. "
        "Use the save_parsed_recipe tool to return the structured data.\n\n"
        "For instructions, format them as clearly numbered steps "
        "(e.g. '1. ...\\n2. ...'), one step per line. "
        "Group related actions into sensible paragraphs separated by blank lines "
        "(e.g. prep, cooking, finishing). "
        "Add step numbers and paragraph breaks even if the original "
        "text lacks them.\n\n"
        "For ingredient names, try to match these existing ingredients "
        "when possible (use the exact name if it matches):\n"
        f"{ingredient_list}\n\n"
        "If an ingredient doesn't match any existing one, "
        "use a clear, simple English name in lowercase."
    )

    image_b64 = base64.standard_b64encode(image_data).decode("ascii")

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=system_prompt,
        tools=[RECIPE_PARSE_TOOL],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Parse this recipe from the image.",
                    },
                ],
            }
        ],
    )

    for block in response.content:
        if block.type == "tool_use" and block.name == "save_parsed_recipe":
            return _build_recipe_from_tool_call(block.input, existing_ingredients)

    raise ValueError("LLM did not return structured recipe data")
