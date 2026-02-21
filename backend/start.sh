#!/bin/sh
set -e

echo "Running database migrations..."
uv run alembic upgrade head

echo "Starting server..."
exec uv run python -c "
import socket, uvicorn

sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
sock.bind(('::', 8000))
uvicorn.run('app.main:app', fd=sock.fileno())
"
