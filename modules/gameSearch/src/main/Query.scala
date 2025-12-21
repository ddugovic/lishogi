package lila.gameSearch

import org.joda.time.DateTime

import shogi.Color
import shogi.Mode
import shogi.Status

import lila.common.Json.jodaWrites
import lila.rating.RatingRange
import lila.search.Range

case class Query(
    user1: Option[String] = None,
    user2: Option[String] = None,
    winner: Option[String] = None,
    loser: Option[String] = None,
    winnerColor: Option[Int] = None,
    perf: Option[Int] = None,
    source: Option[Int] = None,
    status: Option[Int] = None,
    plies: Range[Int] = Range.none,
    averageRating: Range[Int] = Range.none,
    hasAi: Option[Boolean] = None,
    aiLevel: Range[Int] = Range.none,
    rated: Option[Boolean] = None,
    date: Range[DateTime] = Range.none,
    duration: Range[Int] = Range.none,
    clock: Clocking = Clocking(),
    sorting: Sorting = Sorting.default,
    analysed: Option[Boolean] = None,
    senteUser: Option[String] = None,
    goteUser: Option[String] = None,
) {

  def nonEmpty =
    user1.nonEmpty ||
      user2.nonEmpty ||
      winner.nonEmpty ||
      loser.nonEmpty ||
      winnerColor.nonEmpty ||
      perf.nonEmpty ||
      source.nonEmpty ||
      status.nonEmpty ||
      plies.nonEmpty ||
      averageRating.nonEmpty ||
      hasAi.nonEmpty ||
      aiLevel.nonEmpty ||
      rated.nonEmpty ||
      date.nonEmpty ||
      duration.nonEmpty ||
      clock.nonEmpty ||
      analysed.nonEmpty
}

object Query {

  import play.api.libs.json._

  import Range.rangeJsonWriter

  implicit private val sortingJsonWriter: OWrites[Sorting]   = Json.writes[Sorting]
  implicit private val clockingJsonWriter: OWrites[Clocking] = Json.writes[Clocking]
  implicit val jsonWriter: OWrites[Query]                    = Json.writes[Query]

  private type Seconds = Int

  val durations: List[Seconds] =
    List(
      30,
      60 * 1,
      60 * 2,
      60 * 3,
      60 * 5,
      60 * 10,
      60 * 15,
      60 * 20,
      60 * 30,
      60 * 60 * 1,
      60 * 60 * 2,
      60 * 60 * 3,
    )

  val clockInits: List[Seconds] = List(
    0,
    30,
    45,
    60 * 1,
    60 * 2,
    60 * 3,
    60 * 5,
    60 * 10,
    60 * 15,
    60 * 20,
    60 * 30,
    60 * 45,
    60 * 60,
    60 * 90,
    60 * 120,
    60 * 150,
    60 * 180,
  )

  val clockIncs: List[Seconds] = List(0, 1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90, 120, 150, 180)

  val clockByos: List[Seconds] = List(0, 1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90, 120, 150, 180)

  // 1: Sente, 2: Gote, 3: None
  val winnerColors: List[Int] = List(1, 2, 3)
  def winnerColorsToColor(v: Int): Option[Color] =
    if (v == 1) Color.Sente.some
    else if (v == 2) Color.Gote.some
    else none

  val sources: List[Int] = lila.game.Source.searchable.map(_.id)

  val modes: List[Int] = Mode.all.map(_.id)

  val plies: List[Int] =
    ((1 to 5) ++ (10 to 45 by 5) ++ (50 to 90 by 10) ++ (100 to 300 by 25)).toList

  val averageRatings: List[Int] = (RatingRange.min to RatingRange.max by 100).toList

  // 0: Human, 1: Computer
  val hasAis: List[Int] = List(0, 1)

  val aiLevels: List[Int] = (1 to 10).toList

  val statuses: List[Int] = Status.finishedNotCheated
    .filterNot { s =>
      s.is(_.Timeout) ||
      s.is(_.NoStart) ||
      s.is(_.UnknownFinish) ||
      s.is(_.Repetition)
    }
    .map(_.id)
}
