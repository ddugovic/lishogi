package lila.tournament

import org.joda.time.DateTime
import reactivemongo.akkastream.cursorProducer
import reactivemongo.api.ReadPreference
import reactivemongo.api.bson._

import lila.db.dsl._
import lila.game.Game
import lila.tournament.BSONHandlers._
import lila.user.User

final class ArrangementRepo(val coll: Coll)(implicit
    ec: scala.concurrent.ExecutionContext,
) {

  private def selectTour(tourId: Tournament.ID) = $doc(Arrangement.BSONFields.tourId -> tourId)
  private def selectUser(userId: User.ID)       = $doc(Arrangement.BSONFields.users -> userId)

  private def selectTourUser(tourId: Tournament.ID, userId: User.ID) =
    $doc(
      Arrangement.BSONFields.tourId -> tourId,
      Arrangement.BSONFields.users  -> userId,
    )
  private def selectTourUsers(tourId: Tournament.ID, user1Id: User.ID, user2Id: User.ID) =
    $doc(
      Arrangement.BSONFields.tourId -> tourId,
      Arrangement.BSONFields.users $all List(user1Id, user2Id),
    )
  // to hit tour index
  private def selectTourGame(tourId: Tournament.ID, gameId: Game.ID) =
    $doc(
      Arrangement.BSONFields.tourId -> tourId,
      Arrangement.BSONFields.gameId -> gameId,
    )

  private val selectPlaying     = $doc(Arrangement.BSONFields.status $lt shogi.Status.Mate.id)
  private val selectWithGame    = $doc(Arrangement.BSONFields.gameId $exists true)
  private val selectWithoutGame = $doc(Arrangement.BSONFields.gameId $exists false)
  private val selectUnfinished = $or(
    Arrangement.BSONFields.status $lt shogi.Status.Mate.id,
    Arrangement.BSONFields.status $exists false,
  )

  private val recentSort = $doc(Arrangement.BSONFields.scheduledAt -> -1)

  def byId(id: Arrangement.ID): Fu[Option[Arrangement]] = coll.byId[Arrangement](id)

  def byLookup(lookup: Arrangement.Lookup): Fu[Option[Arrangement]] =
    coll.one[Arrangement]((lookup.id ?? { id =>
      $id(id)
    }) ++ selectTourUsers(lookup.tourId, lookup.users._1, lookup.users._2))

  def byGame(tourId: Tournament.ID, gameId: Game.ID): Fu[Option[Arrangement]] =
    coll.one[Arrangement](selectTourGame(tourId, gameId))

  def allByTour(tourId: Tournament.ID): Fu[List[Arrangement]] =
    coll.list[Arrangement](selectTour(tourId))

  def havePlayedTogether(tourId: Tournament.ID, user1Id: User.ID, user2Id: User.ID): Fu[Boolean] =
    coll.exists(selectTourUsers(tourId, user1Id, user2Id))

  def clearUnfinished(tourId: Tournament.ID) =
    coll.update
      .one(
        selectTour(tourId) ++ selectUnfinished,
        $unset(
          Arrangement.BSONFields.gameId,
          Arrangement.BSONFields.startedAt,
          Arrangement.BSONFields.scheduledAt,
          Arrangement.BSONFields.u1ScheduledAt,
          Arrangement.BSONFields.u2ScheduledAt,
          Arrangement.BSONFields.u1ReadyAt,
          Arrangement.BSONFields.u2ReadyAt,
          Arrangement.BSONFields.lockedScheduledAt,
          Arrangement.BSONFields.lastNotified,
        ),
        multi = true,
      )
      .void

  def removeUnfinished(tourId: Tournament.ID) =
    coll.delete.one(selectTour(tourId) ++ selectUnfinished).void

  def find(tourId: Tournament.ID, userId: User.ID): Fu[List[Arrangement]] =
    coll.list[Arrangement](selectTourUser(tourId, userId))

  def findPlaying(tourId: Tournament.ID, userId: User.ID): Fu[List[Arrangement]] =
    coll.list[Arrangement](selectTourUser(tourId, userId) ++ selectPlaying)

  def isPlaying(tourId: Tournament.ID, userId: User.ID): Fu[Boolean] =
    coll.exists(selectTourUser(tourId, userId) ++ selectPlaying)

  def countByTour(tourId: Tournament.ID): Fu[Int] =
    coll.countSel(selectTour(tourId))

  def countWithGame(tourId: Tournament.ID): Fu[Int] =
    coll.countSel(selectTour(tourId) ++ selectWithGame)

  def update(arrangement: Arrangement): Funit =
    coll.update.one($id(arrangement.id), arrangement, upsert = true).void

  def finish(g: lila.game.Game, arr: Arrangement) =
    if (g.aborted)
      coll.update
        .one(
          $id(arr.id),
          $unset(
            Arrangement.BSONFields.gameId,
            Arrangement.BSONFields.status,
            Arrangement.BSONFields.startedAt,
          ),
        )
        .void
    else
      coll.update
        .one(
          $id(arr.id),
          $set(
            Arrangement.BSONFields.status -> g.status.id,
            Arrangement.BSONFields.winner -> g.winnerUserId.map(_ == arr.user1.id),
            Arrangement.BSONFields.plies  -> g.plies,
          ) ++ $unset(
            Arrangement.BSONFields.lastNotified,
            Arrangement.BSONFields.lockedScheduledAt,
          ),
        )
        .void

  def setLastNotified(id: Arrangement.ID, date: DateTime) =
    coll.updateField($id(id), Arrangement.BSONFields.lastNotified, date).void

  def delete(id: Arrangement.ID) = coll.delete.one($id(id)).void

  def removeByTour(tourId: Tournament.ID) = coll.delete.one(selectTour(tourId)).void

  def recentGameIdsByTourAndUserId(
      tourId: Tournament.ID,
      userId: User.ID,
      nb: Int,
  ): Fu[List[Tournament.ID]] =
    coll
      .find(
        selectTourUser(tourId, userId),
        $doc(Arrangement.BSONFields.gameId -> true).some,
      )
      .sort(recentSort)
      .cursor[Bdoc]()
      .list(nb)
      .dmap {
        _.flatMap(_.getAsOpt[Game.ID](Arrangement.BSONFields.gameId))
      }

  private[tournament] def countByTourIdAndUserIds(tourId: Tournament.ID): Fu[Map[User.ID, Int]] = {
    val max = 10_000
    coll
      .aggregateList(maxDocs = max) { framework =>
        import framework._
        Match(selectTour(tourId)) -> List(
          Project($doc(Arrangement.BSONFields.users -> true, Arrangement.BSONFields.id -> false)),
          UnwindField(Arrangement.BSONFields.users),
          GroupField(Arrangement.BSONFields.users)("nb" -> SumAll),
          Sort(Descending("nb")),
          Limit(max),
        )
      }
      .map {
        _.view
          .flatMap { doc =>
            doc.getAsOpt[User.ID]("_id") flatMap { uid =>
              doc.int("nb") map { uid -> _ }
            }
          }
          .toMap
      }
  }

  private[tournament] def rawStats(tourId: Tournament.ID): Fu[List[Bdoc]] = {
    coll.aggregateList(maxDocs = 3) { framework =>
      import framework._
      Match(selectTour(tourId)) -> List(
        Project(
          $doc(
            Arrangement.BSONFields.id     -> false,
            Arrangement.BSONFields.winner -> true,
            Arrangement.BSONFields.plies  -> true,
          ),
        ),
        GroupField(Arrangement.BSONFields.winner)(
          "games" -> SumAll,
          "moves" -> SumField(Arrangement.BSONFields.plies),
        ),
      )
    }
  }

  private[tournament] def upcomingAdapter(user: User) =
    new lila.db.paginator.Adapter[Arrangement](
      collection = coll,
      selector = selectUser(user.id) ++ selectWithoutGame ++
        $doc(Arrangement.BSONFields.scheduledAt $gt DateTime.now.minusHours(24)),
      projection = none,
      sort = $sort asc Arrangement.BSONFields.scheduledAt,
      readPreference = ReadPreference.secondaryPreferred,
    )

  private[tournament] def updatedAdapter(user: User) =
    new lila.db.paginator.Adapter[Arrangement](
      collection = coll,
      selector = selectUser(user.id) ++ selectWithoutGame,
      projection = none,
      sort = $sort desc Arrangement.BSONFields.updatedAt,
      readPreference = ReadPreference.secondaryPreferred,
    )

}
