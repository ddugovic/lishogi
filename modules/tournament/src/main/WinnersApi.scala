package lila.tournament

import scala.concurrent.duration._

import play.api.Mode
import play.api.i18n.Lang

import org.joda.time.DateTime
import reactivemongo.api.ReadPreference
import reactivemongo.api.bson.BSONDocumentHandler

import shogi.variant.Variant

import lila.db.dsl._
import lila.tournament.Schedule.Freq

case class Winner(
    tourId: String,
    userId: String,
    tourName: String,
    schedule: Option[String],
    date: DateTime,
) {
  def trans(implicit lang: Lang) =
    schedule.flatMap(Schedule.fromNameKeys).fold(tourName)(_.trans)
}

case class FreqWinners(
    yearly: Option[Winner],
    monthly: Option[Winner],
    custom: Option[Winner],
) {

  lazy val top: Option[Winner] =
    custom.filter(_.date isAfter DateTime.now.minusDays(2)) orElse
      monthly.filter(_.date isAfter DateTime.now.minusDays(7)) orElse
      yearly orElse monthly orElse custom

  lazy val userIds = List(yearly, monthly, custom).flatten.map(_.userId)
}

case class AllWinners(
    realTime: FreqWinners,
    correspondence: FreqWinners,
    variants: Map[String, FreqWinners],
) {

  lazy val top: List[Winner] = List(
    List(realTime, correspondence).flatMap(_.top),
    WinnersApi.variants.flatMap { v =>
      variants get v.key flatMap (_.top)
    },
  ).flatten

  def userIds =
    List(realTime, correspondence).flatMap(
      _.userIds,
    ) :::
      variants.values.toList.flatMap(_.userIds)
}

final class WinnersApi(
    tournamentRepo: TournamentRepo,
    mongoCache: lila.memo.MongoCache.Api,
    scheduler: akka.actor.Scheduler,
    mode: play.api.Mode,
)(implicit ec: scala.concurrent.ExecutionContext) {

  import BSONHandlers._
  implicit private val WinnerHandler: BSONDocumentHandler[Winner] =
    reactivemongo.api.bson.Macros.handler[Winner]
  implicit private val FreqWinnersHandler: BSONDocumentHandler[FreqWinners] =
    reactivemongo.api.bson.Macros.handler[FreqWinners]
  implicit private val AllWinnersHandler: BSONDocumentHandler[AllWinners] =
    reactivemongo.api.bson.Macros.handler[AllWinners]

  private def fetchScheduled(freq: Freq, since: DateTime): Fu[List[Tournament]] =
    tournamentRepo.coll
      .find(
        $doc(
          "schedule.freq" -> freq.key,
          "startsAt" $gt since.minusHours(12),
          "winner" $exists true,
        ),
      )
      .sort($sort desc "startsAt")
      .cursor[Tournament](ReadPreference.secondaryPreferred)
      .list(Int.MaxValue)

  private def fetchCustom(since: DateTime): Fu[List[Tournament]] =
    tournamentRepo.coll
      .find(
        $doc(
          "startsAt" $gt since.minusHours(12),
          "createdBy" $exists true,
          "nbPlayers" $gte 3,
          "winner" $exists true,
        ),
      )
      .sort($sort desc "startsAt")
      .cursor[Tournament](ReadPreference.secondaryPreferred)
      .list(Int.MaxValue)

  private def firstStandardWinner(
      tours: List[Tournament],
      isCorrespondence: Boolean,
  ): Option[Winner] =
    tours
      .find { t =>
        t.variant.standard && t.isCorrespondence == isCorrespondence
      }
      .flatMap(_.winner)

  private def firstVariantWinner(tours: List[Tournament], variant: Variant): Option[Winner] =
    tours.find(_.variant == variant).flatMap(_.winner)

  private def sinceDays(days: Int) =
    if (mode == Mode.Prod) DateTime.now.minusDays(days)
    else new DateTime(0) // since the dawn of time

  private def fetchAll: Fu[AllWinners] =
    for {
      yearlies  <- fetchScheduled(Freq.Yearly, sinceDays(2 * 365))
      monthlies <- fetchScheduled(Freq.Monthly, sinceDays(3 * 30))
      custom    <- fetchCustom(sinceDays(2 * 7))
    } yield {
      def standardFreqWinners(isCorrespondence: Boolean): FreqWinners =
        FreqWinners(
          yearly = firstStandardWinner(yearlies, isCorrespondence),
          monthly = firstStandardWinner(monthlies, isCorrespondence),
          custom = firstStandardWinner(custom, isCorrespondence),
        )
      AllWinners(
        realTime = standardFreqWinners(isCorrespondence = false),
        correspondence = standardFreqWinners(isCorrespondence = true),
        variants = WinnersApi.variants.view.map { v =>
          v.key -> FreqWinners(
            yearly = firstVariantWinner(yearlies, v),
            monthly = firstVariantWinner(monthlies, v),
            custom = firstVariantWinner(custom, v),
          )
        }.toMap,
      )
    }

  private val allCache = mongoCache.unit[AllWinners](
    "tournament:winner:all",
    59 minutes,
  ) { loader =>
    _.refreshAfterWrite(1 hour)
      .buildAsyncFuture(loader(_ => fetchAll))
  }

  def all: Fu[AllWinners] = allCache.get {}

  // because we read on secondaries, delay cache clear
  def clearCache(tour: Tournament): Unit =
    if (tour.schedule.exists(_.freq.isDailyOrBetter))
      scheduler.scheduleOnce(5.seconds) { allCache.invalidate {}.unit }.unit

}

object WinnersApi {

  val variants = Variant.all.filterNot(_.standard)
}
