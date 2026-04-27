import socketio

from app.core.permissions import Permission
from app.sockets.middleware import authenticate_socket, socket_require_permission

sio = socketio.AsyncNamespace("/recruiter")


@sio.on("connect")
async def on_connect(sid: str, environ: dict, auth: dict) -> None:
    await authenticate_socket(sid, environ, auth)
    await socket_require_permission(sid, "/recruiter", Permission.INTERVIEW_WATCH_LIVE)


@sio.on("recruiter:watch_join")
async def on_recruiter_watch_join(sid: str, data: dict) -> None:
    pass


@sio.on("recruiter:inject_question")
async def on_recruiter_inject_question(sid: str, data: dict) -> None:
    pass


@sio.on("recruiter:terminate")
async def on_recruiter_terminate(sid: str, data: dict) -> None:
    pass


@sio.on("collab:message")
async def on_collab_message(sid: str, data: dict) -> None:
    pass
