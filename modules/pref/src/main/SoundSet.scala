package lila.pref

class SoundSet private[pref] (val key: String, val enName: String, val jaName: String) {

  override def toString = key

  def cssClass = key
}

sealed trait SoundSetBase {

  val all: List[SoundSet]

  val default: SoundSet

  lazy val allByKey = all map { s =>
    s.key -> s
  } toMap

  def apply(key: String) = allByKey.getOrElse(key.toLowerCase, default)

  def contains(key: String) = allByKey contains key.toLowerCase

}

object SoundSet extends SoundSetBase {

  val default = new SoundSet("shogi", "Shogi", "将棋")
  val silent  = new SoundSet("silent", "Silent", "無音")

  val all = List(
    silent,
    default,
    new SoundSet("shogialt", "Shogi Alternative", "将棋（代替）"),
    new SoundSet("chess", "Chess", "チェス"),
    new SoundSet("nes", "NES", "ファミコン"),
    new SoundSet("sfx", "SFX", "効果音"),
    new SoundSet("speech", "Speech", "音声"),
  )

}

object ClockSoundSet extends SoundSetBase {

  val silent  = new SoundSet("silent", "Silent", "無音")
  val default = new SoundSet("system", "System", "システム")

  val all = List(
    silent,
    default,
    new SoundSet("chisei_mazawa", "Mazawa Chisei", "真澤千星"),
    new SoundSet("sakura_ajisai", "Sakura Ajisai", "紫陽花さくら"),
    new SoundSet("ippan_dansei", "Ordinary Male", "一般男性"),
    new SoundSet("shougi_sennin", "Shogi Sage", "将棋仙人"),
    new SoundSet("robot_ja", "Robot (JP)", "ロボット(日本語)"),
    new SoundSet("eigo", "English", "英語女性"),
    new SoundSet("robot_en", "Robot (EN)", "ロボット（英語）"),
  )

}
