#!/usr/bin/env sh

deno install -f \
  --allow-env=HOME \
  --allow-run=git \
  --allow-read="$HOME/.organizado/" \
  --allow-write="$HOME/.organizado/" \
  $(dirname $0)/cli.ts
