#!/usr/bin/env sh

deno --version &>/dev/null
DENO_EXISTS=$?
git --version &>/dev/null
GIT_EXISTS=$?

if [ $DENO_EXISTS != 0 ]; then
  echo "Deno is required" >&2
fi

if [ $GIT_EXISTS != 0 ]; then
  echo "Git is required" >&2
fi

if [[ $DENO_EXISTS != 0 || $GIT_EXISTS != 0 ]]; then
  exit 1
fi

SOURCE_DIR=$(
  if [[ -z $SOURCE_DIR ]]; then
    echo $HOME/.organizado/repo/organizado
  else
    echo $SOURCE_DIR
  fi
)

if [ -d $SOURCE_DIR/.git/ ]; then
  (
    cd $SOURCE_DIR
    git pull -f
  )
else
  git clone https://github.com/JonDotsoy/organizado $SOURCE_DIR
fi

deno install -f \
  --allow-env=HOME \
  --allow-run=git,code \
  --allow-read="$HOME/.organizado/,$SOURCE_DIR/.tmp/" \
  --allow-write="$HOME/.organizado/,$SOURCE_DIR/.tmp/" \
  $SOURCE_DIR/cli.ts
