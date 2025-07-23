package lila.chatroom

import lila.room.RoomSocket.{ Protocol => RP, _ }
import lila.socket.RemoteSocket.{ Protocol => P, _ }

final private class ChatroomSocket(
    remoteSocketApi: lila.socket.RemoteSocket,
    chat: lila.chat.ChatApi,
)(implicit
    ec: scala.concurrent.ExecutionContext,
) {

  lazy val rooms = makeRoomMap(send)

  subscribeChat(rooms, _.Chatroom)

  private lazy val handler: Handler =
    roomHandler(
      rooms,
      chat,
      logger,
      roomId => _.Chatroom(roomId.value).some,
      localTimeout = none,
      chatBusChan = _.Chatroom,
    )

  private lazy val send: String => Unit = remoteSocketApi.makeSender("chatroom-out").apply _

  remoteSocketApi.subscribe("chatroom-in", RP.In.reader)(
    handler orElse remoteSocketApi.baseHandler,
  ) >>- send(P.Out.boot)
}
