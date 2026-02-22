from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://menu:menu@localhost:5432/menu"
    app_password: str = "changeme"
    secret_key: str = "change-this-secret-key"
    potluck_anthropic_api_key: str = ""
    cookie_max_age: int = 365 * 24 * 60 * 60  # 1 year

    model_config = {"env_prefix": ""}


settings = Settings()
