package lila.user

import scala.concurrent.duration._

import org.joda.time.DateTime
import reactivemongo.api.bson._

import lila.common.Icons
import lila.db.dsl._
import lila.memo._

final class TrophyApi(
    coll: Coll,
    kindColl: Coll,
    cacheApi: CacheApi,
)(implicit ec: scala.concurrent.ExecutionContext) {

  private val trophyKindObjectBSONHandler = Macros.handler[TrophyKind]

  val kindCache = cacheApi.sync[String, TrophyKind](
    name = "trophy.kind",
    initialCapacity = 32,
    compute = id =>
      kindColl.byId(id)(trophyKindObjectBSONHandler) map { k =>
        k.getOrElse(TrophyKind.Unknown)
      },
    default = _ => TrophyKind.Unknown,
    strategy = Syncache.WaitAfterUptime(20 millis),
    expireAfter = Syncache.ExpireAfterWrite(1 hour),
  )

  implicit private val trophyKindStringBSONHandler: BSONHandler[TrophyKind] =
    BSONStringHandler.as[TrophyKind](kindCache.sync, _._id)

  implicit private val trophyBSONHandler: BSONDocumentHandler[Trophy] = Macros.handler[Trophy]

  def findByUser(user: User, max: Int = 50): Fu[List[Trophy]] =
    coll.list[Trophy]($doc("user" -> user.id), max).map(_.filter(_.kind != TrophyKind.Unknown))

  def roleBasedTrophies(
      user: User,
      isPublicMod: Boolean,
      isDev: Boolean,
      isVerified: Boolean,
  ): List[Trophy] =
    List(
      isPublicMod option Trophy(
        _id = "",
        user = user.id,
        kind = TrophyKind(
          _id = "moderator",
          name = "Lishogi moderator",
          url = "//lishogi.org/report".some,
          klass = "icon3d".some,
          icon = Icons.agent.some,
          order = 100,
        ),
        date = org.joda.time.DateTime.now,
        url = none,
      ),
      isDev option Trophy(
        _id = "",
        user = user.id,
        kind = TrophyKind(
          _id = "developer",
          name = "Lishogi developer",
          url = "https://github.com/WandererXII/lishogi".some,
          klass = "icon3d".some,
          icon = Icons.tools.some,
          order = 101,
        ),
        date = org.joda.time.DateTime.now,
        url = none,
      ),
      isVerified option Trophy(
        _id = "",
        user = user.id,
        kind = TrophyKind(
          _id = "verified",
          name = "Verified account",
          url = none,
          klass = "icon3d".some,
          icon = Icons.toriGate.some,
          order = 102,
        ),
        date = org.joda.time.DateTime.now,
        url = none,
      ),
    ).flatten

  def award(trophyUrl: String, userId: String, kindKey: String): Funit =
    coll.insert
      .one(
        $doc(
          "_id"  -> lila.common.ThreadLocalRandom.nextString(8),
          "user" -> userId,
          "kind" -> kindKey,
          "url"  -> trophyUrl,
          "date" -> DateTime.now,
        ),
      ) void
}
