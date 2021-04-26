package shogi
package variant

import format.Usi

import scalaz.Validation.FlatMap._

case object Crazyhouse
    extends Variant(
      id = 10,
      key = "crazyhouse",
      name = "Crazyhouse",
      shortName = "Crazy",
      title = "Captured pieces can be dropped back on the board instead of moving a piece.",
      standardInitialPosition = true
    ) {

  val pieces: Map[Pos, Piece] = Variant.symmetricRank(backRank, backRank2)

  
}
