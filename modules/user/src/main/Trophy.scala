package lila.user

import org.joda.time.DateTime

case class Trophy(
    _id: String, // random
    user: String,
    kind: TrophyKind,
    date: DateTime,
    url: Option[String],
) extends Ordered[Trophy] {

  def timestamp = date.getMillis

  def compare(other: Trophy) =
    if (kind.order == other.kind.order) date compareTo other.date
    else Integer.compare(kind.order, other.kind.order)
}

case class TrophyKind(
    _id: String,
    name: String,
    order: Int,
    url: Option[String],
    klass: Option[String],
    icon: Option[String] = none,
    withCustomImage: Boolean = false,
)

object TrophyKind {
  object Unknown
      extends TrophyKind(
        _id = "unknown",
        name = "Unknown",
        order = 0,
        url = none,
        klass = none,
        icon = none,
        withCustomImage = false,
      )
}
