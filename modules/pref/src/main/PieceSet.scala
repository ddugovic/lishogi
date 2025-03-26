package lila.pref

// key is tied to file names and db, title can be easily changed
class PieceSet private[pref] (val key: String, val name: String) {

  override def toString = key

  def cssClass = key

}

sealed trait PieceSetBase {

  val all: List[PieceSet]

  lazy val allByKey = all map { p =>
    p.key -> p
  } toMap

  def apply(key: String) = allByKey.getOrElse(key.toLowerCase, PieceSetBase.default)

  def contains(key: String) = allByKey contains key.toLowerCase

}

object PieceSetBase {
  val default = new PieceSet("ryoko_1kanji", "Ryoko 1-Kanji")
}

object PieceSet extends PieceSetBase {

  val all = List(
    PieceSetBase.default,
    new PieceSet("kanji_light", "Kanji Light"),
    new PieceSet("kanji_brown", "Kanji Brown"),
    new PieceSet("orangain", "orangain"),
    new PieceSet("kanji_red_wood", "Kanji Red Wood"),
    new PieceSet("portella", "Portella"),
    new PieceSet("portella_2kanji", "Portella 2-Kanji"),
    new PieceSet("1kanji_3d", "Kanji 3D"),
    new PieceSet("2kanji_3d", "2-Kanji 3D"),
    new PieceSet("shogi_cz", "Shogi.cz"),
    new PieceSet("shogi_fcz", "Czech"),
    new PieceSet("engraved_cz", "Engraved Shogi.cz"),
    new PieceSet("engraved_cz_bnw", "Engraved Shogi.cz - black and white"),
    new PieceSet("kanji_guide_shadowed", "Kanji Guide Shadowed"),
    new PieceSet("valdivia", "Valdivia"),
    new PieceSet("vald_opt", "Valdivia 2"),
    new PieceSet("shogi_bnw", "Shogi - black and white"),
    new PieceSet("pixel", "Pixel 8bit"),
    new PieceSet("intl_colored_2d", "International Colored 2D"),
    new PieceSet("intl_colored_3d", "International Colored 3D"),
    new PieceSet("intl_shadowed", "International Shadowed"),
    new PieceSet("intl_monochrome_2d", "International Monochrome 2D"),
    new PieceSet("intl_wooden_3d", "International Wooden 3D"),
    new PieceSet("intl_portella", "International Portella"),
    new PieceSet("international", "International"),
    new PieceSet("firi", "Firi"),
    new PieceSet("joyful", "Joyful"),
    new PieceSet("characters", "Characters"),
    new PieceSet("simple_kanji", "Simple Kanji"),
    new PieceSet("doubutsu", "Doubutsu"),
    new PieceSet("logy_games", "Logy Games"),
    new PieceSet("western", "Western"),
  )

}

object ChuPieceSet extends PieceSetBase {

  val all = List(
    PieceSetBase.default,
    new PieceSet("eigetsu_gyoryu", "Eigetsu Gyoryu"),
    new PieceSet("intl", "International"),
    new PieceSet("fcz", "Czech"),
    new PieceSet("intl_bnw", "International - black and white"),
    new PieceSet("firi", "Firi"),
    new PieceSet("mnemonic", "Mnemonic"),
  )

}

object KyoPieceSet extends PieceSetBase {

  val all = List(
    PieceSetBase.default,
    new PieceSet("orangain", "orangain"),
    new PieceSet("kanji", "Kanji with promotions"),
    new PieceSet("intl", "International with promotions"),
    new PieceSet("international", "International"),
    new PieceSet("simple_kanji", "Simple Kanji"),
    new PieceSet("doubutsu", "Doubutsu"),
    new PieceSet("joyful", "Joyful"),
    new PieceSet("logy_games", "Logy Games"),
  )

}
