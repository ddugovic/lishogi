package lila.tournament

import org.joda.time.DateTime

import shogi.Color

case class Arrangement(
    id: Arrangement.ID, // random
    tourId: Tournament.ID,
    user1: Arrangement.User,
    user2: Arrangement.User,
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

  def users = List(user1, user2)

  def userIds = users.map(_.id)

  def hasUser(userId: lila.user.User.ID) = userIds contains userId

  def user(userId: lila.user.User.ID) = users.find(_.id == userId)

  def opponentUser(userId: lila.user.User.ID) =
    if (userId == user1.id) user2.some
    else if (userId == user2.id) user1.some
    else none

  def updateUser(userId: lila.user.User.ID, f: (Arrangement.User) => Arrangement.User) =
    if (userId == user1.id) copy(user1 = f(user1))
    else if (userId == user2.id) copy(user2 = f(user2))
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

  def setReadyAt(userId: lila.user.User.ID, userReadyAt: Option[DateTime]) =
    updateUser(userId, _.copy(readyAt = userReadyAt))

  def startGame(gid: lila.game.Game.ID, color: Color) = {
    val now = DateTime.now
    copy(
      user1 = user1.clearAll,
      user2 = user2.clearAll,
      gameId = gid.some,
      startedAt = now.some,
      color = color.some, // same color after abandoned games
    )
  }

  def setSettings(settings: Arrangement.Settings) =
    if (gameId.isDefined)
      copy(
        name = settings.name,
        // points = settings.points, // once we do point recalculation
      )
    else
      copy(
        name = settings.name,
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

  case class User(
      id: lila.user.User.ID,
      readyAt: Option[DateTime],
      scheduledAt: Option[DateTime],
  ) {
    def clearAll = copy(scheduledAt = none, readyAt = none)

    def isReady =
      readyAt.exists(_ isAfter DateTime.now.minusSeconds(Arrangement.readyTolerance))
  }

  case class Settings(
      name: Option[String],
      color: Option[Color],
      points: Option[Points],
      scheduledAt: Option[DateTime],
  )

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

  case class Lookup(
      id: Option[ID], // Arrangements are created when needed, so ID might not exist at the time
      tourId: Tournament.ID,
      users: (lila.user.User.ID, lila.user.User.ID),
  ) {
    def userList = List(users._1, users._2)
  }

  private[tournament] def make(
      tourId: Tournament.ID,
      users: (lila.user.User.ID, lila.user.User.ID),
  ): Arrangement =
    Arrangement(
      id = lila.common.ThreadLocalRandom.nextString(8),
      tourId = tourId,
      user1 = Arrangement.User(
        id = users._1,
        readyAt = none,
        scheduledAt = none,
      ),
      user2 = Arrangement.User(
        id = users._2,
        readyAt = none,
        scheduledAt = none,
      ),
    )

  object BSONFields {
    val id                = "_id"
    val tourId            = "t"
    val users             = "u"
    val u1ReadyAt         = "r1"
    val u2ReadyAt         = "r2"
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
