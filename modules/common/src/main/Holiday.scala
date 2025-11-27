package lila.common

import play.api.i18n.Lang

import org.joda.time.DateTime
import org.joda.time.DateTimeConstants._

case class Holiday(
    key: String,
    enMessage: String,
    jaMessage: String,
) {
  def trans(implicit lang: Lang) =
    if (lang.language == "ja") jaMessage else enMessage
}

object Holiday {

  val YearStart    = Holiday("year-start", "Happy New Year!", "明けましておめでとうございます")
  val Setsubun     = Holiday("setsubun", "Setsubun", "節分")
  val Hinamatsuri  = Holiday("hinamatsuri", "Hinamatsuri", "雛祭り")
  val ChildrensDay = Holiday("childrens-day", "Children's Day", "こどもの日")
  val Tanabata     = Holiday("tanabata", "Tanabata", "七夕")
  val Tsukimi      = Holiday("tsukimi", "Tsukimi", "月見")
  val Birthday     = Holiday("birthday", "Lishogi Birthday", "Lishogi誕生日")
  val Halloween    = Holiday("halloween", "Halloween", "ハロウィン")
  val ShogiDay     = Holiday("shogi-day", "Shogi Day", "将棋の日")
  val Christmas    = Holiday("christmas", "Merry Christmas!", "メリークリスマス！")
  val YearEnd      = Holiday("year-end", "Happy New Year!", "良いお年を")

  def find(date: DateTime): Option[Holiday] =
    (date.getYear, date.getMonthOfYear, date.getDayOfMonth) match {
      case (_, JANUARY, 1) =>
        YearStart.some

      case (_, FEBRUARY, 3) =>
        Setsubun.some

      case (_, MARCH, 3) =>
        Hinamatsuri.some

      case (_, MAY, 5) =>
        ChildrensDay.some

      case (_, JULY, 7) =>
        Tanabata.some

      case (2026, SEPTEMBER, 25) | (2027, SEPTEMBER, 15) | (2028, OCTOBER, 3) |
          (2029, SEPTEMBER, 2) | (2030, SEPTEMBER, 12) =>
        Tsukimi.some

      case (_, SEPTEMBER, 29) =>
        Birthday.some

      case (_, OCTOBER, 31) =>
        Halloween.some

      case (_, NOVEMBER, 17) =>
        ShogiDay.some

      case (_, DECEMBER, 24) | (_, DECEMBER, 25) =>
        Christmas.some

      case (_, DECEMBER, 31) =>
        YearEnd.some

      case _ => none

    }

}
