package lila.gameSearch

case class Sorting(f: String, order: String)

object Sorting {

  val fields = List(
    Fields.date,
    Fields.plies,
    Fields.averageRating,
  )

  val orders = List(
    "desc",
    "asc",
  )

  val default = Sorting(Fields.date, "desc")
}
