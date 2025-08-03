package lila.report

import play.api.libs.json.JsObject
import play.api.libs.json.Json

import org.joda.time.DateTime
import reactivemongo.api._
import reactivemongo.api.bson._

import lila.common.config.CollName
import lila.db.dsl._
import lila.user.User

final class JsEventsApi(
    db: lila.db.Db,
)(implicit
    ec: scala.concurrent.ExecutionContext,
) {

  private val coll = db(CollName("report_events"))

  def getRecent: Fu[JsObject] =
    coll
      .find($empty)
      .sort($sort desc "u")
      .cursor[Bdoc]()
      .list(limit = 256)
      .map { docs =>
        Json.obj("events" -> (docs flatMap { doc =>
          for {
            id      <- doc.string("_id")
            updated <- doc.getAsOpt[DateTime]("u")
            count   <- doc.int("c")
            vals = doc.getAsOpt[List[String]]("v")
          } yield Json
            .obj(
              "id"      -> id,
              "updated" -> updated.toString,
              "count"   -> count,
            )
            .add("values" -> vals)
        }))
      }

  def update(eventName: String, userId: Option[User.ID], value: Option[String]) =
    coll
      .update(false, writeConcern = WriteConcern.Unacknowledged)
      .one(
        $id(s"${~userId}:${eventName.filter(_.isLetterOrDigit).take(32)}"),
        $set(
          "u" -> DateTime.now,
        ) ++ $inc("c" -> 1) ++ {
          value ?? { v => $addToSet("v" -> v.take(32)) }
        },
        upsert = true,
      )
      .void

}
