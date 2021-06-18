package lila.explorer

import org.joda.time.DateTime

import lila.game.{ Game, GameRepo }
import lila.importer.{ ImportData, Importer }

final class ExplorerImporter(
    endpoint: InternalEndpoint,
    gameRepo: GameRepo,
    gameImporter: Importer,
    ws: play.api.libs.ws.WSClient
)(implicit ec: scala.concurrent.ExecutionContext) {

  private val masterGameEncodingFixedAt = new DateTime(2016, 3, 9, 0, 0)

  def apply(id: Game.ID): Fu[Option[Game]] =
    gameRepo game id flatMap {
      case Some(game) if !game.isKifImport || game.createdAt.isAfter(masterGameEncodingFixedAt) =>
        fuccess(game.some)
      case _ =>
        (gameRepo remove id) >> fetchKif(id) flatMap {
          case None => fuccess(none)
          case Some(kif) =>
            gameImporter(
              ImportData(kif, none),
              user = "lishogi".some,
              forceId = id.some
            ) map some
        }
    }

  private def fetchKif(id: String): Fu[Option[String]] = {
    ws.url(s"$endpoint/master/kif/$id").get() map {
      case res if res.status == 200 => res.body.some
      case _                        => None
    }
  }
}
