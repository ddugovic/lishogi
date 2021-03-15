package shogi
package variant

case object FromPosition
    extends Variant(
      id = 3,
      key = "fromPosition",
      name = "From Position",
      shortName = "SFEN",
      title = "Custom starting position",
      standardInitialPosition = false
    ) {

  def pieces = Standard.pieces
}
