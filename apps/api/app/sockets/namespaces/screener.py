import socketio

from app.core.permissions import Permission
from app.sockets.middleware import authenticate_socket, socket_require_permission

sio = socketio.AsyncNamespace("/screener")


@sio.on("connect")
async def on_connect(sid: str, environ: dict, auth: dict) -> None:
    await authenticate_socket(sid, environ, auth)
    await socket_require_permission(sid, "/screener", Permission.SCREENER_RUN)


@sio.on("screener:start")
async def on_screener_start(sid: str, data: dict) -> None:
    pass
