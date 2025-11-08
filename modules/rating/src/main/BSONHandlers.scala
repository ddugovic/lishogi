package lila.rating

import reactivemongo.api.bson.BSONHandler

import lila.common.Iso
import lila.db.dsl._

object BSONHandlers {

  implicit val perfTypeIdIso: Iso.IntIso[PerfType] = Iso.int[PerfType](
    from = id => PerfType.byId(id).getOrElse(PerfType.RealTime),
    to = pt => pt.id,
  )

  implicit val perfTypeKeyIso: Iso.StringIso[PerfType] = Iso.string[PerfType](
    from = key => PerfType.byKey(key).getOrElse(PerfType.RealTime),
    to = pt => pt.key,
  )

  implicit val perfTypeIdHandler: BSONHandler[PerfType]  = intIsoHandler(perfTypeIdIso)
  implicit val perfTypeKeyHandler: BSONHandler[PerfType] = stringIsoHandler(perfTypeKeyIso)
}
