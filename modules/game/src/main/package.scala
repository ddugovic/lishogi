package lila

package object game extends PackageObject {

  type KifMoves    = Vector[String]
  type RatingDiffs = shogi.Color.Map[Int]

  private[game] def logger = lila.log("game")
}
