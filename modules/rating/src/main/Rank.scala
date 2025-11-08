package lila.rating

import play.api.i18n.Lang

import cats.data.NonEmptyList

case class Rank(
    jaName: String,
    enName: String,
    min: Int,
    max: Int,
) {

  def trans(implicit lang: Lang) =
    if (lang.language == "ja") jaName else enName
}

object Rank {

  private val defs: NonEmptyList[(String, String, Int)] = NonEmptyList.of(
    ("15級", "15-kyu", 75),
    ("14級", "14-kyu", 75),
    ("13級", "13-kyu", 75),
    ("12級", "12-kyu", 75),
    ("11級", "11-kyu", 75),
    ("10級", "10-kyu", 75),
    ("9級", "9-kyu", 75),
    ("8級", "8-kyu", 75),
    ("7級", "7-kyu", 75),
    ("6級", "6-kyu", 75),
    ("5級", "5-kyu", 75),
    ("4級", "4-kyu", 75),
    ("3級", "3-kyu", 75),
    ("2級", "2-kyu", 75),
    ("1級", "1-kyu", 100),
    ("初段", "1-Dan", 100),
    ("二段", "2-Dan", 100),
    ("三段", "3-Dan", 100),
    ("四段", "4-Dan", 125),
    ("五段", "5-Dan", 150),
    ("六段", "6-Dan", 150),
    ("七段", "7-Dan", 225),
    ("八段", "8-Dan", 0),
  )

  val all: NonEmptyList[Rank] =
    defs.tail.foldLeft {
      val (ja, en, step) = defs.head
      val nextMax        = Glicko.minRating + step
      val first          = Rank(ja, en, Glicko.minRating, nextMax)
      (nextMax, NonEmptyList.one(first))
    } { case ((currentMin, acc), (ja, en, step)) =>
      val nextMax = if (step == 0) Glicko.maxRating else currentMin + step
      val level   = Rank(ja, en, currentMin, nextMax)
      (nextMax, acc.append(level))
    }._2

  def fromRating(rating: Int): Rank =
    all
      .find(l => rating >= l.min && rating < l.max)
      .getOrElse {
        all.head.some
          .filter(rating < _.min)
          .getOrElse(all.last)
      }

  def fromPerf(perf: Perf): Option[Rank] =
    !perf.provisional option fromRating(perf.intRating)

}
