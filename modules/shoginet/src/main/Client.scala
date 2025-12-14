package lila.shoginet

import scala.util.Failure
import scala.util.Success
import scala.util.Try

import com.gilt.gfc.semver.SemVer
import org.joda.time.DateTime

import lila.common.IpAddress
import lila.common.Random

case class Client(
    _id: Client.Key,                   // API key used to authenticate and assign move or analysis
    userId: Client.UserId,             // lishogi user ID
    skill: Client.Skill,               // what can this client do
    instance: Option[Client.Instance], // last seen instance
    enabled: Boolean,
    createdAt: DateTime,
) {

  def key = _id

  def fullId = s"$userId:$key"

  def updateInstance(i: Client.Instance): Option[Client] =
    instance.fold(i.some)(_.update(i, isAnon)) map { newInstance =>
      copy(instance = newInstance.some)
    }

  def lishogi = userId.value == lila.user.User.lishogiId

  def isAnon = key == Client.anon.key

  def disabled = !enabled

  override def toString = s"$key by $userId"
}

object Client {

  val anon = Client(
    _id = Key("anon"),
    userId = UserId("anon"),
    skill = Skill.All,
    instance = None,
    enabled = true,
    createdAt = DateTime.now,
  )

  case class Key(value: String)     extends AnyVal with StringValue
  case class Version(value: String) extends AnyVal with StringValue
  case class UserId(value: String)  extends AnyVal with StringValue

  case class Instance(
      version: Version,
      ip: IpAddress,
      seenAt: DateTime,
  ) {

    def update(i: Instance, isAnon: Boolean): Option[Instance] =
      if (i.version != version && !isAnon) i.some
      else if (i.ip != ip && !isAnon) i.some
      else if (i.seenAt isAfter seenAt.plusMinutes(5)) i.some
      else none

    def seenRecently = seenAt isAfter Instance.recentSince
  }

  object Instance {

    def recentSince = DateTime.now.minusMinutes(15)
  }

  sealed trait Skill {
    def key = toString.toLowerCase
  }
  object Skill {
    case object Move     extends Skill
    case object MoveStd  extends Skill // Most requests, option to have dedicated client
    case object Analysis extends Skill
    case object Puzzle   extends Skill
    case object All      extends Skill
    val all                = List(Move, MoveStd, Analysis, Puzzle, All)
    def byKey(key: String) = all.find(_.key == key)
  }

  final class ClientVersion(minVersionString: String) {

    val minVersion = SemVer(minVersionString)

    def accept(v: Client.Version): Try[Unit] =
      Try(SemVer(v.value)) match {
        case Success(version) if version >= minVersion => Success(())
        case Success(_) =>
          Failure(
            new Exception(
              s"Version $v is no longer supported. Please restart shoginet to upgrade.",
            ),
          )
        case Failure(error) => Failure(error)
      }
  }

  def makeKey = Key(Random.secureString(8))
}
