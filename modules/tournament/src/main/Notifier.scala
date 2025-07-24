package lila.tournament

import scala.concurrent.duration._

import akka.stream.scaladsl._
import org.joda.time.DateTime
import reactivemongo.akkastream.cursorProducer
import reactivemongo.api.bson._

import lila.db.dsl._
import lila.notify.Notification
import lila.notify.Notification.Notifies
import lila.notify.NotifyApi

// We want to notify 24 hours before tour happens and when arrs get confirmed
// no notifications for tours/arrs that were just created or arranged
final class Notifier(
    arrangementRepo: ArrangementRepo,
    tourRepo: TournamentRepo,
    playerRepo: PlayerRepo,
    notifyApi: NotifyApi,
)(implicit
    ec: scala.concurrent.ExecutionContext,
    mat: akka.stream.Materializer,
) {

  // to prevent confirmation spam
  private val arrangementConfirmationCache = new lila.memo.ExpireSetMemo(2 hour)
  def arrangementConfirmation(arr: Arrangement, by: String): Funit = {
    val cacheKey = s"${arr.id}:${~arr.scheduledAt.map(_.toString)}"
    (!arrangementConfirmationCache.get(cacheKey)) ?? {
      arrangementConfirmationCache.put(cacheKey)
      ~(arr.opponentUser(by) map { opp =>
        notifyApi.addNotification(
          Notification.make(
            Notifies(opp.id),
            lila.notify.ArrangementConfirmation(
              id = arr.id,
              tid = arr.tourId,
              user = by,
            ),
          ),
        )
      })
    }
  }

  // to avoid notifying directly after confirmation
  val arrangementsAgreedTimeCache = new lila.memo.ExpireSetMemo(3 hour)
  def arrangements = {
    val now = DateTime.now
    arrangementRepo.coll
      .find(
        $doc(
          Arrangement.BSONFields.scheduledAt $gt now.plusHours(23) $lt now.plusHours(24),
        ) ++ $or(
          Arrangement.BSONFields.lastNotified $exists false,
          Arrangement.BSONFields.lastNotified $lt now.minusHours(2),
        ),
        $doc(
          Arrangement.BSONFields.id     -> true,
          Arrangement.BSONFields.tourId -> true,
          Arrangement.BSONFields.users  -> true,
        ).some,
      )
      .cursor[Notifier.Arrangement]()
      .documentSource(Int.MaxValue)
      .mapAsync(1) { arr =>
        arrangementRepo.setLastNotified(arr._id, now) inject {
          (!arrangementsAgreedTimeCache.get(arr._id)) ?? {
            arrangementReminderNotifications(arr)
          }
        }
      }
      .mapConcat(identity)
      .grouped(5)
      .throttle(1, 500 millis)
      .mapAsync(1)(ns => notifyApi.addNotifications(ns.toList))
      .toMat(Sink.ignore)(Keep.right)
      .run()
      .void
  }

  private def arrangementReminderNotifications(arr: Notifier.Arrangement): List[Notification] =
    arr.u.map(user =>
      Notification.make(
        Notifies(user),
        lila.notify.ArrangementReminder(
          id = arr._id,
          tid = arr.t,
          users = arr.u,
        ),
      ),
    )

  def tours = {
    val now = DateTime.now
    tourRepo.coll
      .find(
        $doc(
          "startsAt" $gt now.plusHours(23) $lt now.plusHours(24),
          "createdAt" $gt now.plusHours(28),
        ) ++ $or(
          "notified" $exists false,
          "notified" $lt now.minusHours(48),
        ),
        $doc("_id" -> true, "startsAt" -> true).some,
      )
      .cursor[Notifier.Tour]()
      .documentSource(Int.MaxValue)
      .mapAsync(1) { tour =>
        tourRepo.setReminderNotified(tour._id, now) >>
          tourNotifications(tour)
      }
      .mapConcat(identity)
      .grouped(5)
      .throttle(1, 500 millis)
      .mapAsync(1)(ns => notifyApi.addNotifications(ns.toList))
      .toMat(Sink.ignore)(Keep.right)
      .run()
      .void
  }

  private def tourNotifications(tour: Notifier.Tour): Fu[List[Notification]] =
    playerRepo
      .allByTour(tour._id)
      .map { players =>
        players.map(player =>
          Notification.make(
            Notifies(player.userId),
            lila.notify.TournamentReminder(
              id = tour._id,
              date = tour.startsAt,
            ),
          ),
        )
      }
}

private object Notifier {

  case class Arrangement(_id: String, t: String, u: List[String])

  implicit lazy val arrangementHandler: BSONDocumentHandler[Arrangement] =
    Macros.handler[Arrangement]

  case class Tour(_id: String, startsAt: DateTime)

  implicit lazy val tourHandler: BSONDocumentHandler[Tour] = Macros.handler[Tour]

}
