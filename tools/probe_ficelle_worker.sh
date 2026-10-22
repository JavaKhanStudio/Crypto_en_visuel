#!/usr/bin/env bash
# Does the ficelle Worker (wrangler.jsonc, worker/ficelle.js) serve this repo
# under /ficelle/ the way simonbedardprog.com will? Runs it under `wrangler dev`
# on localhost (nothing is deployed) and checks redirects, files and 404s.
# Exit 0 when every line is ✓.
#
#   tools/probe_ficelle_worker.sh            # against wrangler dev
#   tools/probe_ficelle_worker.sh https://simonbedardprog.com   # against the live site
set -u
cd "$(dirname "$0")/.."
# A free port: other sessions keep python http.servers on the 87xx ones.
PORT=${PORT:-$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1])')}
base=${1:-}
if [ -z "$base" ]; then
  base="http://127.0.0.1:$PORT"
  npx -y wrangler@4 dev --port "$PORT" --ip 127.0.0.1 >/tmp/probe_ficelle.$$.log 2>&1 &
  pid=$!
  trap 'kill $pid 2>/dev/null; rm -f /tmp/probe_ficelle.$$.log' EXIT
  for _ in $(seq 90); do grep -q 'Ready on' /tmp/probe_ficelle.$$.log && break
    kill -0 $pid 2>/dev/null || { cat /tmp/probe_ficelle.$$.log; exit 2; }; sleep 1; done
fi
fails=0
check() {  # path, wanted code, wanted Location (or ''), wanted body text (or '')
  out=$(curl -s -D - -o /tmp/probe_ficelle_body.$$ -m 15 "$base$1")
  code=$(printf '%s' "$out" | head -1 | awk '{print $2}')
  loc=$(printf '%s' "$out" | tr -d '\r' | awk -F': ' 'tolower($1)=="location"{print $2}')
  loc=${loc#"$base"}
  if [ "$code" = "$2" ] && { [ -z "$3" ] || [ "$loc" = "$3" ]; } \
     && { [ -z "$4" ] || grep -q "$4" /tmp/probe_ficelle_body.$$; }; then
    printf '  ✓ %-34s %s %s\n' "$1" "$code" "$loc"
  else
    printf '  ✗ %-34s %s %s (wanted %s %s %s)\n' "$1" "$code" "$loc" "$2" "$3" "$4"
    fails=$((fails + 1))
  fi
}
echo "ficelle Worker at $base"
check /ficelle                     301 /ficelle/ ''
check /ficelle/                    200 ''        'importmap\|<title>'
check /ficelle/garde               307 /ficelle/garde/ ''
check /ficelle/garde/              200 ''        '<html'
check /ficelle/garde/index.html    307 /ficelle/garde/ ''
check /ficelle/vendor/three/three.module.min.js 200 '' ''
check /ficelle/home.js             200 ''        ''
check /ficelle/tools/assets.html   404 ''        ''
check /ficelle/tests/              404 ''        ''
check /ficelle/README.md           404 ''        ''
check /ficelle/wrangler.jsonc      404 ''        ''
check /ficelle/.atelier/packs.toml 404 ''        ''
check /ficelle/nope/               404 ''        ''
check /ficellex                    404 ''        ''
rm -f /tmp/probe_ficelle_body.$$
[ "$fails" = 0 ] && echo "  ok." || echo "  $fails line(s) wrong."
[ "$fails" = 0 ]
