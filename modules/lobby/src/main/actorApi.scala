package lila.lobby
package actorApi

import scala.concurrent.Promise

import lila.game.Game
import lila.socket.Socket.Sri
import lila.socket.Socket.Sris

private[lobby] case class SaveSeek(msg: AddSeek)
private[lobby] case class RemoveHook(hookId: String)
private[lobby] case class RemoveSeek(seekId: String)
private[lobby] case class RemoveHooks(hooks: Set[Hook])
private[lobby] case class CancelHook(sri: Sri)
private[lobby] case class CancelSeek(seekId: String, user: LobbyUser)
private[lobby] case class BiteHook(hookId: String, sri: Sri, user: Option[LobbyUser])
private[lobby] case class BiteSeek(seekId: String, user: LobbyUser)
private[lobby] case class JoinHook(sri: Sri, hook: Hook, game: Game, creatorColor: shogi.Color)
private[lobby] case class JoinSeek(
    userId: String,
    seek: Seek,
    game: Game,
    creatorColor: shogi.Color,
)
private[lobby] case class HookSub(member: LobbySocket.Member, value: Boolean)
private[lobby] case class AllHooksFor(member: LobbySocket.Member, hooks: Vector[Hook])
private[lobby] case class LeaveBatch(sris: Iterable[Sri])
private[lobby] case object LeaveAll
private[lobby] case object Resync
private[lobby] case class HookIds(ids: Vector[String])

private[lobby] case class GetSrisP(promise: Promise[Sris])

case class AddHook(hook: Hook)
case class AddSeek(seek: Seek)
