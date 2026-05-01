#!/bin/sh
if [ ! -f /app/data/cache.db ]; then
  cp /app/data/seed.db /app/data/cache.db
fi
exec node server.js
