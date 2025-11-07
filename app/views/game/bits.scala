package views.html.game

import controllers.routes
import play.api.i18n.Lang

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.game.Game
import lila.game.Player
import lila.game.Pov
import lila.user.Title

object bits {

  def featuredJs(pov: Pov): Frag =
    frag(
      gameSfenNoCtx(pov, tv = true),
      vstext(pov)(lila.i18n.defaultLang),
    )

  def mini(pov: Pov)(implicit ctx: Context): Frag =
    a(href := gameLink(pov, ctx.me))(
      gameSfen(pov, ctx.me, withLink = false),
      vstext(pov),
    )

  def miniBoard(
      sfen: shogi.format.forsyth.Sfen,
      color: shogi.Color = shogi.Sente,
      variant: shogi.variant.Variant = shogi.variant.Standard,
  ): Frag =
    div(
      cls         := s"mini-board parse-sfen ${variantClass(variant)}",
      dataColor   := color.name,
      dataSfen    := sfen.value,
      dataVariant := variant.key,
    )(shogigroundEmpty(variant, color))

  def gameIcon(game: Game): String =
    if (game.initialSfen.isDefined) Icons.position
    else if (game.imported) Icons.uploadCloud
    else if (game.hasAi) Icons.cogs
    else game.perfType.icon

  def sides(
      pov: Pov,
      tour: Option[lila.tournament.TourAndTeamVs],
      cross: Option[lila.game.Crosstable.WithMatchup],
      simul: Option[lila.simul.Simul],
      userTv: Option[lila.user.User] = None,
      bookmarked: Boolean,
  )(implicit ctx: Context) =
    div(
      side.meta(pov, tour, simul, userTv, bookmarked = bookmarked),
      cross.map { c =>
        div(cls := "crosstable")(crosstable(ctx.userId.fold(c)(c.fromPov), pov.gameId.some))
      },
    )

  def variantLink(
      variant: shogi.variant.Variant,
      perfType: Option[lila.rating.PerfType] = None,
  )(implicit lang: Lang): Frag = {
    def link(
        href: String,
        title: String,
        name: String,
    ) = a(
      cls      := "variant-link",
      st.href  := href,
      rel      := "nofollow",
      target   := "_blank",
      st.title := title,
    )(name)

    if (!variant.standard)
      link(
        href = routes.Prismic.variant(variant.key).url,
        title = variantDescription(variant),
        name = variantName(variant),
      )
    else
      perfType match {
        case Some(pt) => span(pt.trans)
        case _        => variantName(variant)
      }
  }

  private def playerTitle(player: Player) =
    player.userId.flatMap(lightUser).flatMap(_.title) map Title.apply map { t =>
      span(cls := "title", dataBot(t), title := Title titleName t)(t.value)
    }

  def vstext(pov: Pov)(implicit lang: Lang): Frag =
    span(cls := "vstext")(
      span(cls := "vstext__pl user-link")(
        playerUsername(pov.player, withRating = false, withTitle = false),
        br,
        playerTitle(pov.player) map { t =>
          frag(t, " ")
        },
        pov.player.rating.map(_.toString).orElse(pov.player.engineConfig.map(engineLevel)),
        pov.player.provisional option "?",
      ),
      pov.game.clock map { c =>
        span(cls := "vstext__clock")(shortClockName(c.config))
      } orElse {
        pov.game.daysPerTurn map { days =>
          span(cls := "vstext__clock")(
            if (days == 1) trans.oneDay() else trans.nbDays.pluralSame(days),
          )
        }
      },
      span(cls := "vstext__op user-link")(
        playerUsername(pov.opponent, withRating = false, withTitle = false),
        br,
        pov.opponent.rating.map(_.toString).orElse(pov.opponent.engineConfig.map(engineLevel)),
        pov.opponent.provisional option "?",
        playerTitle(pov.opponent) map { t =>
          frag(" ", t)
        },
      ),
    )
}
