package lila.tournament

import play.api.i18n.Lang

import org.joda.time.DateTime

import shogi.format.forsyth.Sfen
import shogi.variant.Variant

import lila.i18n.I18nKeys
import lila.rating.PerfType

case class Schedule(
    format: Format,
    freq: Schedule.Freq,
    speed: Schedule.Speed,
    variant: Variant,
    position: Option[Sfen],
    at: DateTime,
    conditions: Condition.All = Condition.All.empty,
) {

  def trans(implicit lang: Lang): String = {
    val perfTypeTrans = PerfType
      .byVariant(variant)
      .map(
        _.trans,
      ) | Schedule.Speed.trans(speed)
    val sched =
      s"${freq.trans(perfTypeTrans)}"
    if (format == Format.Arena) I18nKeys.tourname.xArena.txt(sched)
    else if (format == Format.Robin) I18nKeys.tourname.xRobin.txt(sched)
    else sched
  }

  def nameKeys = List(format.key, freq.key, speed.key, variant.key).mkString(" ")

  def day = at.withTimeAtStartOfDay

  def sameSpeed(other: Schedule) = speed == other.speed

  def similarSpeed(other: Schedule) = Schedule.Speed.similar(speed, other.speed)

  def sameVariant(other: Schedule) = variant.id == other.variant.id

  def sameFreq(other: Schedule) = freq == other.freq

  def sameConditions(other: Schedule) = conditions == other.conditions

  def sameMaxRating(other: Schedule) = conditions sameMaxRating other.conditions

  def similarConditions(other: Schedule) = conditions similar other.conditions

  def sameDay(other: Schedule) = day == other.day

  def hasMaxRating = conditions.maxRating.isDefined

  def similarTo(other: Schedule) =
    similarSpeed(other) && sameVariant(other) && sameFreq(other) && sameConditions(other)

  def perfType = PerfType.byVariant(variant) | Schedule.Speed.toPerfType(speed)

  def plan                                  = Schedule.Plan(this, None)
  def plan(build: Tournament => Tournament) = Schedule.Plan(this, build.some)

  override def toString = s"$freq $variant $speed $conditions $at"
}

object Schedule {

  def fromNameKeys(keys: String): Option[Schedule] = {
    val ks = keys.split(" ")
    for {
      format  <- ks.lift(0).flatMap(Format.byKey)
      freq    <- ks.lift(1).flatMap(Freq.apply)
      speed   <- ks.lift(2).flatMap(Speed.apply)
      variant <- ks.lift(3).flatMap(Variant.apply)
    } yield Schedule(
      format = format,
      freq = freq,
      speed = speed,
      variant = variant,
      position = none,
      at = DateTime.now, // whatever
    )
  }

  case class Plan(schedule: Schedule, buildFunc: Option[Tournament => Tournament]) {

    def build: Tournament = {
      val t = Tournament.scheduleAs(addCondition(schedule), durationFor(schedule))
      buildFunc.foldRight(t) { _(_) }
    }

    def map(f: Tournament => Tournament) =
      copy(
        buildFunc = buildFunc.fold(f)(f.compose).some,
      )
  }

  sealed abstract class Freq(val id: Int, val importance: Int) extends Ordered[Freq] {

    val key = toString.toLowerCase

    def trans(x: String)(implicit lang: Lang) =
      this match {
        case Schedule.Freq.Hourly  => I18nKeys.tourname.hourlyX.txt(x)
        case Schedule.Freq.Daily   => I18nKeys.tourname.dailyX.txt(x)
        case Schedule.Freq.Eastern => I18nKeys.tourname.easternX.txt(x)
        case Schedule.Freq.Weekly  => I18nKeys.tourname.weeklyX.txt(x)
        case Schedule.Freq.Weekend => I18nKeys.tourname.weekendX.txt(x)
        case Schedule.Freq.Monthly => I18nKeys.tourname.monthlyX.txt(x)
        case Schedule.Freq.Yearly  => I18nKeys.tourname.yearlyX.txt(x)
        case Schedule.Freq.Shield  => I18nKeys.tourname.xShield.txt(x)
        case _                     => s"$key $x"
      }

    def compare(other: Freq) = Integer.compare(importance, other.importance)

    def isDaily          = this == Schedule.Freq.Daily
    def isDailyOrBetter  = this >= Schedule.Freq.Daily
    def isWeeklyOrBetter = this >= Schedule.Freq.Weekly
  }
  object Freq {
    case object Hourly  extends Freq(10, 10)
    case object Daily   extends Freq(20, 20)
    case object Eastern extends Freq(30, 15)
    case object Weekly  extends Freq(40, 40)
    case object Weekend extends Freq(41, 41)
    case object Monthly extends Freq(50, 50)
    case object Shield  extends Freq(51, 51)
    case object Yearly  extends Freq(70, 70)
    case object Unique  extends Freq(90, 59)
    val all: List[Freq] = List(
      Hourly,
      Daily,
      Eastern,
      Weekly,
      Weekend,
      Monthly,
      Shield,
      Yearly,
      Unique,
    )
    def apply(key: String) = all.find(_.key == key)
    def byId(id: Int)      = all.find(_.id == id)
  }

  sealed abstract class Speed(val id: Int) {
    val key = lila.common.String lcfirst toString
  }
  object Speed {
    case object UltraBullet    extends Speed(5)  // to remove?
    case object HyperBullet    extends Speed(10) // to remove
    case object Bullet         extends Speed(20)
    case object SuperBlitz     extends Speed(25) // to remove
    case object Blitz          extends Speed(30)
    case object HyperRapid     extends Speed(40) // to remove
    case object Rapid          extends Speed(50)
    case object Classical      extends Speed(60)
    case object Correspondence extends Speed(80)
    val all: List[Speed] =
      List(
        UltraBullet,
        HyperBullet,
        Bullet,
        SuperBlitz,
        Blitz,
        HyperRapid,
        Rapid,
        Classical,
        Correspondence,
      )
    val mostPopular: List[Speed] = List(Bullet, Blitz, Rapid, Classical)
    def apply(key: String) =
      all.find(_.key == key) orElse all.find(_.key.toLowerCase == key.toLowerCase)
    def byId(id: Int) = all find (_.id == id)
    def similar(s1: Speed, s2: Speed) =
      (s1, s2) match {
        // Similar speed tournaments should not be simultaneously scheduled
        case (a, b) if a == b                            => true
        case (Bullet, SuperBlitz) | (SuperBlitz, Bullet) => true
        case (Blitz, HyperRapid) | (HyperRapid, Blitz)   => true
        case _                                           => false
      }
    def fromClock(clock: shogi.Clock.Config) = {
      val time = clock.estimateTotalSeconds
      if (time < 60) UltraBullet
      else if (time < 180) HyperBullet
      else if (time < 300) Bullet
      else if (time < 450) SuperBlitz
      else if (time < 600) Blitz
      else if (time < 1000) HyperRapid
      else if (time < 1500) Rapid
      else Classical
    }
    def toPerfType(speed: Speed) =
      speed match {
        case UltraBullet          => PerfType.UltraBullet
        case HyperBullet | Bullet => PerfType.Bullet
        case SuperBlitz | Blitz   => PerfType.Blitz
        case HyperRapid | Rapid   => PerfType.Rapid
        case Classical            => PerfType.Classical
        case Correspondence       => PerfType.Correspondence
      }
    private def specialPrefix(speed: Speed) =
      speed match {
        case HyperBullet | HyperRapid => "H-"
        case SuperBlitz               => "S-"
        case _                        => ""
      }
    def trans(speed: Speed)(implicit lang: Lang) =
      s"${specialPrefix(speed)}${toPerfType(speed).trans}"

  }

  private[tournament] def durationFor(s: Schedule): Int = {
    import Freq._, Speed._
    import shogi.variant._

    (s.format, s.freq, s.variant, s.speed) match {

      case (Format.Robin, _, _, _) => 24 * 60

      case (_, Hourly, _, UltraBullet | HyperBullet | Bullet) => 27
      case (_, Hourly, _, SuperBlitz | Blitz | HyperRapid)    => 57
      case (_, Hourly, _, Rapid) if s.hasMaxRating            => 57
      case (_, Hourly, _, Rapid | Classical)                  => 117

      case (_, Daily | Eastern, Standard, Blitz)      => 120
      case (_, Daily | Eastern, Standard, HyperRapid) => 150
      case (_, Daily | Eastern, _, HyperRapid)        => 120
      case (_, Daily | Eastern, _, Rapid | Classical) => 180
      case (_, Daily | Eastern, _, _)                 => 75

      case (_, Weekly, Minishogi | Kyotoshogi, _)             => 60
      case (_, Weekly, _, UltraBullet | HyperBullet | Bullet) => 60 * 1 + 30
      case (_, Weekly, _, SuperBlitz | Blitz)                 => 60 * 2
      case (_, Weekly, _, HyperRapid | Rapid)                 => 60 * 3
      case (_, Weekly, _, Classical)                          => 60 * 4

      case (_, Weekend, _, UltraBullet | HyperBullet | Bullet) => 60 * 1 + 30
      case (_, Weekend, _, SuperBlitz | Blitz)                 => 60 * 2
      case (_, Weekend, _, HyperRapid)                         => 60 * 2
      case (_, Weekend, _, Rapid)                              => 60 * 3
      case (_, Weekend, _, Classical)                          => 60 * 4

      case (_, Monthly, Minishogi | Kyotoshogi, _) => 60 * 2
      case (_, Monthly, _, UltraBullet)            => 60 * 2
      case (_, Monthly, _, HyperBullet | Bullet)   => 60 * 3
      case (_, Monthly, _, SuperBlitz | Blitz)     => 60 * 3 + 30
      case (_, Monthly, _, HyperRapid)             => 60 * 4
      case (_, Monthly, _, Rapid)                  => 60 * 5
      case (_, Monthly, _, Classical)              => 60 * 6

      case (_, Shield, _, UltraBullet)          => 60 * 1 + 30
      case (_, Shield, _, HyperBullet | Bullet) => 60 * 2
      case (_, Shield, _, SuperBlitz | Blitz)   => 60 * 3
      case (_, Shield, _, HyperRapid)           => 60 * 4
      case (_, Shield, _, Rapid)                => 60 * 6
      case (_, Shield, _, Classical)            => 60 * 8

      case (_, Yearly, Minishogi | Kyotoshogi, _)             => 60 * 2
      case (_, Yearly, _, UltraBullet | HyperBullet | Bullet) => 60 * 2
      case (_, Yearly, _, SuperBlitz | Blitz)                 => 60 * 3
      case (_, Yearly, _, HyperRapid)                         => 60 * 4
      case (_, Yearly, _, Rapid)                              => 60 * 6
      case (_, Yearly, _, Classical)                          => 60 * 8

      case (_, Unique, _, _) => 60 * 6
      case _                 => 60 * 1
    }
  }

  private[tournament] def clockFor(s: Schedule) = {
    import Speed._

    val CC = shogi.Clock.Config
    val RT = TimeControl.RealTime
    val CR = TimeControl.Correspondence

    (s.freq, s.variant, s.speed) match {
      case (_, _, UltraBullet)    => RT(CC(30, 0, 0, 1))       //      30
      case (_, _, HyperBullet)    => RT(CC(0, 0, 5, 1))        //            5 * 25
      case (_, _, Bullet)         => RT(CC(0, 0, 10, 1))       //           10 * 25
      case (_, _, SuperBlitz)     => RT(CC(3 * 60, 0, 10, 1))  //  3 * 60 + 10 * 25
      case (_, _, Blitz)          => RT(CC(5 * 60, 0, 10, 1))  //  5 * 60 + 10 * 25
      case (_, _, HyperRapid)     => RT(CC(5 * 60, 0, 15, 1))  //  5 * 60 + 15 * 25
      case (_, _, Rapid)          => RT(CC(10 * 60, 0, 15, 1)) // 10 * 60 + 15 * 25
      case (_, _, Classical)      => RT(CC(15 * 60, 0, 30, 1)) // 15 * 60 + 30 * 25
      case (_, _, Correspondence) => CR(3)
    }
  }
  private[tournament] def addCondition(s: Schedule) =
    s.copy(conditions = conditionFor(s))

  private[tournament] def conditionFor(s: Schedule) =
    if (s.conditions.relevant) s.conditions
    else {
      import Freq._

      val nbRatedGame = (s.freq, s.speed) match {
        case (Hourly | Daily | Eastern, _)   => 0
        case (Weekend | Monthly | Yearly, _) => 1
        case (Shield, _)                     => 3
        case _                               => 0
      }

      val minRating = (s.freq, s.variant) match {
        case _ => 0
      }

      Condition.All(
        nbRatedGame = nbRatedGame.some.filter(0 <).map {
          Condition.NbRatedGame(_)
        },
        minRating = minRating.some.filter(0 <).map {
          Condition.MinRating(_)
        },
        maxRating = none,
        titled = none,
        teamMember = none,
      )
    }
}
