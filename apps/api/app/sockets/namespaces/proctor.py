import socketio

from app.sockets.middleware import authenticate_socket, get_socket_user

sio = socketio.AsyncNamespace("/proctor")


@sio.on("connect")
async def on_connect(sid: str, environ: dict, auth: dict) -> None:
    await authenticate_socket(sid, environ, auth)
    user = await get_socket_user(sid, "/proctor")
    if user.role != "SYSTEM":
        raise ConnectionRefusedError("Forbidden")


@sio.on("proctor:flag")
async def on_proctor_flag(sid: str, data: dict) -> None:
    pass
