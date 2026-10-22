"""The one chromium launch of every browser test and shot (r401): the page draws WebGL on the GPU.

Headless SwiftShader draws on the CPU, about 5 cores a browser and 3-5 fps on a loaded machine; new
headless chromium (channel="chromium") with ANGLE on EGL reaches the real GPU at 56-58 fps
(tests/vpn_story.py: 48 s against 295 s, 18/18 ok both, atelier r1994). Shots differ from
SwiftShader's only by antialiasing and animation timing.

    from browser import launch      # tests/ first does sys.path.insert(0, <repo>/tools)
    b = launch(p)                   # p = sync_playwright(); launch(p, 'soft') forces the CPU

CRYPTO_GL=soft (or gpu) overrides what the script asks. When the GPU launch fails, or its page
gets no WebGL or SwiftShader anyway (no GPU on this machine), it falls back to SwiftShader and
says so on stderr. Headless SwiftShader still runs at a low frame rate: test motion against a
threshold, never a window (2bdb831)."""
import os
import sys

GPU = ["--use-gl=angle", "--use-angle=gl-egl", "--ignore-gpu-blocklist", "--enable-gpu"]
SOFT = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
RENDERER = """() => { const g = document.createElement('canvas').getContext('webgl2');
  if (!g) return '';
  const x = g.getExtension('WEBGL_debug_renderer_info');
  return g.getParameter(x ? x.UNMASKED_RENDERER_WEBGL : g.RENDERER); }"""


def launch(p, gl=None, **kw):
    """A chromium Browser from a sync_playwright() handle; gl is 'gpu' (default) or 'soft'."""
    gl = os.environ.get("CRYPTO_GL") or gl or "gpu"
    if gl == "gpu":
        try:
            b = p.chromium.launch(channel="chromium", args=GPU, **kw)
            pg = b.new_page(); r = pg.evaluate(RENDERER); pg.close()
            if r and "swiftshader" not in r.lower():
                return b
            b.close(); why = "its WebGL is " + (r or "missing")
        except Exception as e:
            why = str(e).splitlines()[0]
        print("browser.py: no GPU (%s), drawing on the CPU (SwiftShader)" % why, file=sys.stderr)
    return p.chromium.launch(args=SOFT, **kw)
