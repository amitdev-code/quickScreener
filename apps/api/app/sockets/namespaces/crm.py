import socketio

from app.core.permissions import Permission
from app.sockets.middleware import authenticate_socket, socket_require_permission

sio = socketio.AsyncNamespace("/crm")


@sio.on("connect")
async def on_connect(sid: str, environ: dict, auth: dict) -> None:
    await authenticate_socket(sid, environ, auth)
    await socket_require_permission(sid, "/crm", Permission.CRM_PIPELINE_READ)


@sio.on("crm:subscribe_pipeline")
async def on_crm_subscribe_pipeline(sid: str, data: dict) -> None:
    pass
