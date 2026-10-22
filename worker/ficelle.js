// simonbedardprog.com/ficelle/<path> is the file <path> of this repo.
// Only requests that are no file reach this script (wrangler.jsonc).
const PREFIX = '/ficelle';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Every link in the episodes is relative: /ficelle needs its slash.
    if (url.pathname === PREFIX) {
      url.pathname = PREFIX + '/';
      return Response.redirect(url.toString(), 301);
    }
    if (!url.pathname.startsWith(PREFIX + '/')) {
      return new Response('Not found', { status: 404 });
    }
    url.pathname = url.pathname.slice(PREFIX.length);
    const response = await env.ASSETS.fetch(new Request(url, request));
    // The assets' own redirects (/garde -> /garde/, /x/index.html -> /x/)
    // name a path without the prefix: put it back.
    const location = response.headers.get('Location');
    if (location && location.startsWith('/')) {
      const headers = new Headers(response.headers);
      headers.set('Location', PREFIX + location);
      return new Response(response.body, { status: response.status, headers });
    }
    return response;
  },
};
