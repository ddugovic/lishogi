package lila.game

import play.api.i18n.Lang

import lila.common.LightUser
import lila.i18n.{ I18nKeys => trans }

object Namer {

  def playerTextBlocking(player: Player, withRating: Boolean = false)(implicit
      lightUser: LightUser.GetterSync,
      lang: Lang,
  ): String =
    playerTextUser(player, player.userId flatMap lightUser, withRating)

  def playerText(player: Player, withRating: Boolean = false)(implicit
      lightUser: LightUser.Getter,
      lang: Lang,
  ): Fu[String] =
    player.userId.??(lightUser) dmap {
      playerTextUser(player, _, withRating)
    }

  def engineName(ec: EngineConfig)(implicit lang: Lang): String =
    if (lang.language == "ja") ec.engine.jpFullName
    else ec.engine.fullName

  def engineLevel(ec: lila.game.EngineConfig)(implicit lang: Lang): String =
    trans.levelX.txt(ec.level)

  def engineText(ec: lila.game.EngineConfig, withLevel: Boolean = true)(implicit
      lang: Lang,
  ): String =
    if (withLevel) s"${engineName(ec)} (${engineLevel(ec).toLowerCase})"
    else engineName(ec)

  private def playerTextUser(player: Player, user: Option[LightUser], withRating: Boolean)(implicit
      lang: Lang,
  ): String =
    player.engineConfig.fold(
      user.fold(player.name | trans.anonymousUser.txt()) { u =>
        player.rating.ifTrue(withRating).fold(u.titleName) { r =>
          s"${u.titleName} ($r)"
        }
      },
    ) { ec =>
      engineText(ec, withLevel = withRating)
    }

  def gameVsTextBlocking(game: Game, withRatings: Boolean = false)(implicit
      lightUser: LightUser.GetterSync,
      lang: Lang,
  ): String =
    s"${playerTextBlocking(game.sentePlayer, withRatings)} - ${playerTextBlocking(game.gotePlayer, withRatings)}"

  def gameVsText(game: Game, withRatings: Boolean = false)(implicit
      lightUser: LightUser.Getter,
      lang: Lang,
  ): Fu[String] =
    game.sentePlayer.userId.??(lightUser) zip
      game.gotePlayer.userId.??(lightUser) dmap { case (wu, bu) =>
        s"${playerTextUser(game.sentePlayer, wu, withRatings)} - ${playerTextUser(game.gotePlayer, bu, withRatings)}"
      }

  def ratingString(p: Player) =
    p.rating match {
      case Some(rating) => s"$rating${if (p.provisional) "?" else ""}"
      case _            => "?"
    }
}
