package lila.tournament

import scala.concurrent.ExecutionContextExecutor

import akka.actor._
import org.joda.time.DateTime
import org.joda.time.DateTimeConstants._

final private class TournamentScheduler(
    tournamentRepo: TournamentRepo,
) extends Actor {

  import Schedule.Freq._
  import Schedule.Plan
  import Schedule.Speed._

  import shogi.variant._

  implicit def ec: ExecutionContextExecutor = context.dispatcher

  /* Month plan:
   * First week: Shield standard tournaments
   * Second week: Yearly tournament
   * Third week: Shield variant tournaments
   * Last week: Monthly tournaments
   */

  private[tournament] def allWithConflicts(rightNow: DateTime): List[Plan] = {
    val today       = rightNow.withTimeAtStartOfDay
    val startOfYear = today.dayOfYear.withMinimumValue

    class OfMonth(fromNow: Int) {
      val firstDay = today.plusMonths(fromNow).dayOfMonth.withMinimumValue
      val lastDay  = firstDay.dayOfMonth.withMaximumValue

      val firstWeek  = firstDay.plusDays(7 - (firstDay.getDayOfWeek - 1) % 7)
      val secondWeek = firstWeek plusDays 7
      val thirdWeek  = secondWeek plusDays 7
      val lastWeek   = lastDay.minusDays((lastDay.getDayOfWeek - 1) % 7)
    }
    val thisMonth = new OfMonth(0)
    val nextMonth = new OfMonth(1)

    def secondWeekOf(month: Int) = {
      val start = orNextYear(startOfYear.withMonthOfYear(month))
      start.plusDays(15 - start.getDayOfWeek)
    }

    def orNextYear(date: DateTime) = if (date isBefore rightNow) date plusYears 1 else date

    val farFuture = today plusMonths 7

    val birthday = new DateTime(2020, 9, 29, 12, 0, 0)

    // all dates UTC
    List(
      List( // legendary tournaments!
        at(birthday.withYear(today.getYear), 12) map orNextYear map { date =>
          val yo = date.getYear - 2020
          Schedule(Format.Arena, Unique, Rapid, Standard, none, date) plan {
            _.copy(
              name = s"${date.getYear} Lishogi Anniversary",
              icon = "li-anniversary".some,
              minutes = 12 * 60,
              spotlight = Spotlight(
                headline = s"$yo years of free shogi!",
                description = s"""
We've had $yo great shogi years together!

Thank you all, you rock! ありがとうございます！""",
                homepageHours = 32.some,
              ).some,
            )
          }
        },
      ).flatten,
      List( // yearly tournaments!
        secondWeekOf(FEBRUARY).withDayOfWeek(TUESDAY) -> Blitz,
        secondWeekOf(JULY).withDayOfWeek(MONDAY)      -> Bullet,
        secondWeekOf(OCTOBER).withDayOfWeek(THURSDAY) -> Rapid,
        secondWeekOf(NOVEMBER).withDayOfWeek(FRIDAY)  -> Classical,
      ).flatMap { case (day, speed) =>
        at(day, 13) filter farFuture.isAfter map { date =>
          Schedule(Format.Arena, Yearly, speed, Standard, none, date).plan
        }
      },
      List( // yearly variant tournaments!
        secondWeekOf(JANUARY).withDayOfWeek(WEDNESDAY) -> Minishogi,
        secondWeekOf(APRIL).withDayOfWeek(WEDNESDAY)   -> Checkshogi,
        secondWeekOf(JUNE).withDayOfWeek(WEDNESDAY)    -> Annanshogi,
        secondWeekOf(AUGUST).withDayOfWeek(WEDNESDAY)  -> Kyotoshogi,
      ).flatMap { case (day, variant) =>
        at(day, 17) filter farFuture.isAfter map { date =>
          Schedule(Format.Arena, Yearly, Blitz, variant, none, date).plan
        }
      },
      List(thisMonth, nextMonth).flatMap { month =>
        List(
          List( // monthly standard tournaments!
            month.lastWeek.withDayOfWeek(MONDAY)    -> Bullet,
            month.lastWeek.withDayOfWeek(WEDNESDAY) -> Blitz,
            month.lastWeek.withDayOfWeek(THURSDAY)  -> Rapid,
            month.lastWeek.withDayOfWeek(FRIDAY)    -> Classical,
          ).flatMap { case (day, speed) =>
            at(day, 13) map { date =>
              Schedule(Format.Arena, Monthly, speed, Standard, none, date).plan
            }
          },
          List( // monthly variant tournaments!
            month.firstWeek.withDayOfWeek(MONDAY)    -> Minishogi,
            month.firstWeek.withDayOfWeek(WEDNESDAY) -> Annanshogi,
            month.firstWeek.withDayOfWeek(THURSDAY)  -> Kyotoshogi,
            month.firstWeek.withDayOfWeek(FRIDAY)    -> Checkshogi,
          ).flatMap { case (day, variant) =>
            at(day, 17) map { date =>
              Schedule(Format.Arena, Monthly, Blitz, variant, none, date).plan
            }
          },
          List( // shield tournaments!
            month.firstWeek.withDayOfWeek(MONDAY)    -> Bullet,
            month.firstWeek.withDayOfWeek(WEDNESDAY) -> Blitz,
            month.firstWeek.withDayOfWeek(THURSDAY)  -> Rapid,
            month.firstWeek.withDayOfWeek(FRIDAY)    -> Classical,
          ).flatMap { case (day, speed) =>
            at(day, 12) map { date =>
              Schedule(Format.Arena, Shield, speed, Standard, none, date) plan {
                _.copy(
                  name = s"${speed.toString} Shield",
                  icon = "li-shield".some,
                  spotlight = Some(TournamentShield spotlight speed.toString),
                )
              }
            }
          },
          List( // shield variant tournaments!
            month.thirdWeek.withDayOfWeek(MONDAY)    -> Minishogi,
            month.thirdWeek.withDayOfWeek(WEDNESDAY) -> Annanshogi,
            month.thirdWeek.withDayOfWeek(THURSDAY)  -> Kyotoshogi,
            month.thirdWeek.withDayOfWeek(FRIDAY)    -> Checkshogi,
          ).flatMap { case (day, variant) =>
            at(day, 16) map { date =>
              Schedule(Format.Arena, Shield, Blitz, variant, none, date) plan {
                _.copy(
                  name = s"${variant.name} Shield",
                  icon = "li-shield".some,
                  spotlight = Some(TournamentShield spotlight variant.name),
                )
              }
            }
          },
        ).flatten
      },
    ).flatten filter { _.schedule.at isAfter rightNow }
  }

  private[tournament] def pruneConflicts(scheds: List[Tournament], newTourns: List[Tournament]) =
    newTourns
      .foldLeft(List[Tournament]()) { case (tourns, t) =>
        if (overlaps(t, tourns) || overlaps(t, scheds)) tourns
        else t :: tourns
      }
      .reverse

  private case class ScheduleNowWith(dbScheds: List[Tournament])

  private def overlaps(t: Tournament, ts: List[Tournament]): Boolean =
    t.schedule exists { s =>
      ts exists { t2 =>
        t.variant == t2.variant && (t2.schedule ?? {
          // prevent daily && weekly on the same day
          case s2 if s.freq.isDailyOrBetter && s2.freq.isDailyOrBetter && s.sameSpeed(s2) =>
            s sameDay s2
          case s2 =>
            (
              !t.variant.standard || // overlapping non standard variant
                s.hasMaxRating ||    // overlapping same rating limit
                s.similarSpeed(s2)   // overlapping similar
            ) && s.similarConditions(s2) && t.overlaps(t2)
        })
      }
    }

  private def at(day: DateTime, hour: Int, minute: Int = 0): Option[DateTime] =
    try {
      Some(day.withTimeAtStartOfDay plusHours hour plusMinutes minute)
    } catch {
      case e: Exception =>
        logger.error(s"failed to schedule one: ${e.getMessage}")
        None
    }

  def receive = {

    case TournamentScheduler.ScheduleNow =>
      tournamentRepo.scheduledUnfinished dforeach { tourneys =>
        self ! ScheduleNowWith(tourneys)
      }

    case ScheduleNowWith(dbScheds) =>
      try {
        val newTourns = allWithConflicts(DateTime.now) map { _.build }
        val pruned    = pruneConflicts(dbScheds, newTourns)
        tournamentRepo
          .insert(pruned)
          .logFailure(logger)
          .unit
      } catch {
        case e: org.joda.time.IllegalInstantException =>
          logger.error(s"failed to schedule all: ${e.getMessage}")
      }
  }
}

private object TournamentScheduler {

  case object ScheduleNow
}
