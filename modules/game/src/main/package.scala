package lila

package object game extends PackageObject {

  // TODO: Remove UsiMoves in favor of Moves and Usis
  type UsiMoves    = shogi.Usis
  type RatingDiffs = shogi.Color.Map[Int]

  private[game] def logger = lila.log("game")
}
