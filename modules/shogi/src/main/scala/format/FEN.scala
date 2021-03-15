package shogi.format

final case class SFEN(value: String) extends AnyVal {
  override def toString = value
}
