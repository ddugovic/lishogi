package lila.puzzle

import org.joda.time.DateTime

import lila.user.User

case class PuzzleReport(
    _id: String,
    puzzle: Puzzle.Id,
    text: Option[String],
    by: User.ID,
    date: DateTime,
    closed: Boolean,
) {}

object PuzzleReport {

  def apply(
      puzzle: Puzzle.Id,
      text: Option[String],
      by: User.ID,
  ): PuzzleReport =
    PuzzleReport(
      _id = lila.common.ThreadLocalRandom nextString 8,
      puzzle = puzzle,
      text = text,
      by = by,
      date = DateTime.now,
      closed = false,
    )

}
