package lila.app
package templating

import controllers.routes
import play.api.i18n.Lang

import lila.app.ui.ScalatagsTemplate._
import lila.common.Icons
import lila.i18n.{ I18nKeys => trans }
import lila.tournament.Tournament

trait TournamentHelper { self: AssetHelper with I18nHelper with DateHelper with UserHelper =>

  def tournamentIdToName(id: String)(implicit lang: Lang) =
    env.tournament.getTourName get id getOrElse s"${trans.tournament.txt()} $id"

  def tournamentLink(tourId: String)(implicit lang: Lang): Frag =
    a(
      dataIcon := Icons.trophy,
      cls      := "text",
      href     := routes.Tournament.show(tourId).url,
    )(tournamentIdToName(tourId))

  def tournamentLink(tour: Tournament)(implicit lang: Lang): Frag =
    a(
      dataIcon := Icons.trophy,
      cls      := (if (tour.isScheduled) "text is-gold" else "text"),
      href     := routes.Tournament.show(tour.id).url,
    )(tour.trans)

  def tournamentIconTag(tour: Tournament) = {
    val tourIconCls =
      s"tour-icon ti-${tour.format.key} ti-${tour.perfType.key}${tour.schedule ?? { s =>
          s" ti-${s.freq.key}"
        }}"
    div(cls := tourIconCls)(
      spriteSvg("tour", tour.icon.getOrElse(s"li-${tour.variant.key}")),
    )
  }

  def arrangementIdToName(id: String): Option[String] =
    env.tournament.getArrName(id)

  def arrangementIdToParam(id: String): String =
    lila.tournament.Arrangement.RobinId.parseId(id).map(_.makeParam) | id
}
