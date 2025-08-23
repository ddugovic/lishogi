package lila.app
package templating

import controllers.routes
import play.api.i18n.Lang

import lila.app.ui.ScalatagsTemplate._
import lila.common.Icons
import lila.i18n.{ I18nKeys => trans }
import lila.tournament.Schedule
import lila.tournament.Tournament

trait TournamentHelper { self: I18nHelper with DateHelper with UserHelper =>

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

  def tournamentIcon(tour: Tournament): String =
    tour.schedule.map(_.freq) match {
      case Some(Schedule.Freq.Unique) => Icons.shogiFull
      case _                          => tour.spotlight.flatMap(_.iconFont) | tour.perfType.icon
    }

  def tournamentIconTag(tour: Tournament): Frag =
    i(cls := tour.format.key, dataIcon := tournamentIcon(tour))

  def arrangementIdToName(id: String): Option[String] =
    env.tournament.getArrName(id)

  def arrangementIdToParam(id: String): String =
    lila.tournament.Arrangement.RobinId.parseId(id).map(_.makeParam) | id
}
