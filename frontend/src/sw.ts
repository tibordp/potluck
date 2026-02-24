/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, NetworkOnly } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();
self.skipWaiting();

precacheAndRoute(self.__WB_MANIFEST);

// API routes cached for offline use (NetworkFirst: network with cache fallback).
// Only cache stable, identity-based data — not search results or random suggestions.
// When adding new API endpoints, decide explicitly whether they belong here.
const CACHEABLE_API_PATTERNS = [
  /^\/api\/recipes\/\d+$/, // single recipe detail
  /^\/api\/ingredients(\?|$)/, // ingredient list
  /^\/api\/menus\/current$/, // current menu
  /^\/api\/menus\/\d+$/, // menu by ID
  /^\/api\/menus\/\d+\/shopping-list(\?|$)/, // shopping list
];

const networkFirstStrategy = new NetworkFirst({
  cacheName: 'api-cache',
  plugins: [
    {
      cacheWillUpdate: async ({ response }) => {
        return response?.status === 200 ? response : null;
      },
    },
  ],
});

registerRoute(
  ({ url }) => CACHEABLE_API_PATTERNS.some((re) => re.test(url.pathname)),
  networkFirstStrategy
);

// All other API requests: network only, no caching.
registerRoute(({ url }) => url.pathname.startsWith('/api/'), new NetworkOnly());

// Handle share target POST requests
registerRoute(
  ({ url, request }) => url.pathname === '/share-target' && request.method === 'POST',
  async ({ request }) => {
    const formData = await request.formData();
    const url = formData.get('url') as string | null;
    const text = formData.get('text') as string | null;
    const imageFile = formData.get('image') as File | null;

    if (imageFile && imageFile.size > 0) {
      const cache = await caches.open('share-target-data');
      await cache.put('/share-target-image', new Response(imageFile));
      return Response.redirect('/recipes/import?share_image=1', 303);
    }

    if (url) {
      return Response.redirect(`/recipes/import?share_url=${encodeURIComponent(url)}`, 303);
    }

    if (text) {
      // Check if the text looks like a URL
      try {
        const parsed = new URL(text.trim());
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return Response.redirect(
            `/recipes/import?share_url=${encodeURIComponent(text.trim())}`,
            303
          );
        }
      } catch {
        // Not a URL, treat as text
      }
      return Response.redirect(`/recipes/import?share_text=${encodeURIComponent(text)}`, 303);
    }

    return Response.redirect('/recipes/import', 303);
  },
  'POST'
);
