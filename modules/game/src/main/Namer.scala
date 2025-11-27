package lila.game

import play.api.i18n.Lang

import lila.common.LightUser
import lila.i18n.{ I18nKeys => trans }

object Namer {

  def playerTextBlocking(player: Player, withRank: Boolean = false)(implicit
      lightUser: LightUser.GetterSync,
      lang: Lang,
  ): String =
    playerTextUser(player, player.userId flatMap lightUser, withRank)

  def playerText(player: Player, withRank: Boolean = false)(implicit
      lightUser: LightUser.Getter,
      lang: Lang,
  ): Fu[String] =
    player.userId.??(lightUser) dmap {
      playerTextUser(player, _, withRank)
    }

  def engineName(ec: EngineConfig)(implicit lang: Lang): String =
    if (lang.language == "ja") ec.engine.jpFullName
    else ec.engine.fullName

  def engineLevel(ec: lila.game.EngineConfig)(implicit lang: Lang): String =
    trans.levelX.txt(ec.level)

  def engineText(ec: lila.game.EngineConfig, withLevel: Boolean = true)(implicit
      lang: Lang,
  ): String =
    if (withLevel) s"${engineName(ec)} ${engineLevel(ec).toLowerCase}"
    else engineName(ec)

  private[game] def playerTextUser(
      player: Player,
      user: Option[LightUser],
      withRank: Boolean = true,
  )(implicit
      lang: Lang,
  ): String =
    player.engineConfig.fold(
      user.fold(player.name | trans.anonymousUser.txt()) { u =>
        if (u.isBot) s"${lila.user.Title.BOT} ${u.name}"
        else
          player.stableRating.ifTrue(withRank).fold(u.name) { r =>
            s"${lila.rating.Rank.fromRating(r).trans} ${u.name}"
          }
      },
    ) { ec =>
      engineText(ec, withLevel = withRank)
    }

  def gameVsTextBlocking(game: Game, withRanks: Boolean = false)(implicit
      lightUser: LightUser.GetterSync,
      lang: Lang,
  ): String =
    s"${playerTextBlocking(game.sentePlayer, withRanks)} - ${playerTextBlocking(game.gotePlayer, withRanks)}"

  def gameVsText(game: Game, withRanks: Boolean = false)(implicit
      lightUser: LightUser.Getter,
      lang: Lang,
  ): Fu[String] =
    game.sentePlayer.userId.??(lightUser) zip
      game.gotePlayer.userId.??(lightUser) dmap { case (wu, bu) =>
        s"${playerTextUser(game.sentePlayer, wu, withRanks)} - ${playerTextUser(game.gotePlayer, bu, withRanks)}"
      }
}
