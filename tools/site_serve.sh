#!/bin/sh
# r633: the board's site viewer (Atelier's Labs and "Open the site", 127.0.0.1:8794) serves origin/main,
# not the shared checkout: sessions push from worktrees, so that checkout lags (55 commits on 24 Oct,
# r621's lab 404'd) and cannot be fast-forwarded under the others' uncommitted work.
# Atelier starts it from the shared checkout as
#     sh -c 'git fetch -q origin main; git show origin/main:tools/site_serve.sh | sh -s 8794'
# so the launcher itself is always origin's. It keeps a detached worktree at origin/main
# ($CRYPTO_SITE_TREE, default ~/.cache/deux-generaux-site), serves it with that tree's
# tools/serve_review.py, which re-syncs it every minute (--follow), and writes the print lab's
# review into the shared checkout's lab/print/review/, where a session commits it (as before r633).
port=${1:-8794}
repo=$(pwd)
site=${CRYPTO_SITE_TREE:-$HOME/.cache/deux-generaux-site}
git -C "$repo" fetch -q origin main || echo "site_serve: fetch failed, serving the last origin/main seen"
if ! git -C "$site" rev-parse --git-dir >/dev/null 2>&1; then
  git -C "$repo" worktree prune
  git -C "$repo" worktree add -q --detach "$site" origin/main || exit 1
fi
git -C "$site" checkout -q -f --detach origin/main || exit 1
exec python3 "$site/tools/serve_review.py" "$port" --follow --review-dir "$repo/lab/print/review"
