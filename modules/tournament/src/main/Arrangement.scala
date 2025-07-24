package lila.tournament

import org.joda.time.DateTime

import shogi.Color

case class Arrangement(
    id: Arrangement.ID, // random
    tourId: Tournament.ID,
    user1: Option[Arrangement.User],
    user2: Option[Arrangement.User],
    name: Option[String] = none,
    color: Option[Color] = none, // user1 color
    points: Option[Arrangement.Points] = none,
    gameId: Option[lila.game.Game.ID] = none,
    startedAt: Option[DateTime] = none,
    status: Option[shogi.Status] = none,
    winner: Option[lila.user.User.ID] = none,
    plies: Option[Int] = none,
    scheduledAt: Option[DateTime] = none,
    lockedScheduledAt: Boolean = false,
    lastNotified: Option[DateTime] = none,
) {

  def users = List(user1, user2).flatten

  def userIds = users.map(_.id)

  def hasUser(userId: lila.user.User.ID) = userIds contains userId

  def user(userId: lila.user.User.ID) = users.find(_.id == userId)

  def opponentUser(userId: lila.user.User.ID) =
    if (user1.exists(_.id == userId)) user2
    else if (user2.exists(_.id == userId)) user1
    else none

  def updateUser(userId: lila.user.User.ID, f: (Arrangement.User) => Arrangement.User) =
    if (user1.exists(_.id == userId)) copy(user1 = user1.map(f))
    else if (user2.exists(_.id == userId)) copy(user2 = user2.map(f))
    else this

  def isWithinTolerance(date1: DateTime, date2: DateTime, toleranceSeconds: Int): Boolean =
    Math.abs(date1.getMillis - date2.getMillis) <= toleranceSeconds * 1000

  def setScheduledAt(userId: lila.user.User.ID, userScheduledAt: Option[DateTime]) = {
    val opponentScheduledAt = opponentUser(userId).flatMap(_.scheduledAt)
    val updated             = updateUser(userId, _.copy(scheduledAt = userScheduledAt))

    userScheduledAt.fold {
      updated.copy(
        scheduledAt = none,
      )
    } { usa =>
      opponentScheduledAt
        .filter(isWithinTolerance(_, usa, Arrangement.scheduleTolerance))
        .fold {
          updated.copy(
            scheduledAt = none,
          )
        } { osa =>
          updated.copy(
            scheduledAt = osa.some,
          )
        }
    }
  }

  def startGame(gid: lila.game.Game.ID, color: Color) = {
    val now = DateTime.now
    copy(
      user1 = user1.map(_.clearAll),
      user2 = user2.map(_.clearAll),
      gameId = gid.some,
      startedAt = now.some,
      status = shogi.Status.Started.some,
      color = color.some, // same color after abandoned games
    )
  }

  def setSettings(settings: Arrangement.Settings) =
    if (gameId.isDefined)
      copy(
        name = settings.name,
        // points = settings.points, // Requires point recalculation
      )
    else
      copy(
        name = settings.name,
        user1 = user1 orElse settings.userId1
          .map(id => Arrangement.User(id)), // todo someday: cancel challenges to change users
        user2 = user2 orElse settings.userId2.map(id => Arrangement.User(id)),
        color = settings.color,
        points = settings.points,
        scheduledAt = settings.scheduledAt,
        lockedScheduledAt = settings.scheduledAt.isDefined,
      )

  def hasGame = gameId.isDefined

  def finished = status.exists(_ >= shogi.Status.Mate)
  def playing  = status.exists(_ < shogi.Status.Mate)

}

object Arrangement {

  // seconds
  val scheduleTolerance = 60
  val readyTolerance    = 20

  type ID = String

  case class RobinId(
      tourId: Tournament.ID,
      user1Id: lila.user.User.ID,
      user2Id: lila.user.User.ID,
  ) {
    def makeId = s"$tourId/$user1Id;$user2Id"

    def makeParam = s"$user1Id;$user2Id"

    def userIdList = List(user1Id, user2Id)
  }
  object RobinId {
    // sorts user alphabetically
    def parseId(s: String): Option[RobinId] = s.split("/", 2).toList match {
      case tourId :: users =>
        users.headOption.flatMap(_.split(";").toList.map(lila.user.User.normalize).sorted match {
          case user1 :: user2 :: Nil => Some(RobinId(tourId, user1, user2))
          case _                     => None
        })
      case _ => None
    }
  }

  case class User(
      id: lila.user.User.ID,
      scheduledAt: Option[DateTime] = none,
  ) {
    def clearAll = copy(scheduledAt = none)
  }

  case class Settings(
      name: Option[String],
      userId1: Option[lila.user.User.ID],
      userId2: Option[lila.user.User.ID],
      color: Option[Color],
      points: Option[Points],
      scheduledAt: Option[DateTime],
  ) {
    def userIds = List(userId1, userId2).flatten
  }

  case class Points(loss: Int, draw: Int, win: Int)
  object Points {
    val default = Points(1, 2, 3)
    val max     = 100
    def apply(s: String): Option[Points] =
      s.split(";").toList match {
        case l :: d :: w :: Nil => {
          def parseNum(digit: String) = digit.toIntOption.map(_ atLeast 0 atMost max)
          for {
            loss <- parseNum(l)
            draw <- parseNum(d)
            win  <- parseNum(w)
          } yield Points(loss, draw, win)
        }
        case _ => None
      }
  }

  object BSONFields {
    val id                = "_id"
    val tourId            = "t"
    val users             = "u"
    val u1ScheduledAt     = "d1"
    val u2ScheduledAt     = "d2"
    val name              = "n"
    val color             = "c"
    val points            = "pt"
    val gameId            = "g"
    val startedAt         = "st"
    val status            = "s"
    val winner            = "w"
    val plies             = "p"
    val scheduledAt       = "d"
    val lockedScheduledAt = "l"
    val updatedAt         = "ua"
    val lastNotified      = "ln"
  }
}
