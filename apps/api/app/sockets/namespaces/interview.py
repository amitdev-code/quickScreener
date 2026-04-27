import socketio

from app.sockets.middleware import authenticate_interview_link

sio = socketio.AsyncNamespace("/interview")


@sio.on("connect")
async def on_connect(sid: str, environ: dict, auth: dict) -> None:
    await authenticate_interview_link(sid, environ, auth)


@sio.on("candidate:join")
async def on_candidate_join(sid: str, data: dict) -> None:
    pass


@sio.on("candidate:question_ack")
async def on_candidate_question_ack(sid: str, data: dict) -> None:
    pass


@sio.on("candidate:speaking_start")
async def on_candidate_speaking_start(sid: str, data: dict) -> None:
    pass


@sio.on("candidate:speaking_end")
async def on_candidate_speaking_end(sid: str, data: dict) -> None:
    pass


@sio.on("candidate:reconnect")
async def on_candidate_reconnect(sid: str, data: dict) -> None:
    pass
