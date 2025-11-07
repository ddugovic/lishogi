package lila.round

import scala.concurrent.duration._

import lila.game.Game
import lila.game.GameRepo

final class RecentTvGames(
    gameRepo: GameRepo,
) {
  private val fast = new lila.memo.ExpireSetMemo(10 minutes)
  private val slow = new lila.memo.ExpireSetMemo(2 hours)

  def get(gameId: Game.ID) = fast.get(gameId) || slow.get(gameId)

  def put(game: Game) = {
    gameRepo.setTv(game.id)
    (if (game.isVeryVeryFast || game.isVeryFast) fast else slow) put game.id
  }
}
