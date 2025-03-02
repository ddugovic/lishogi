package lila.pref

class Background private[pref] (val key: String) {

  override def toString = key

  def cssClass = key
}

object Background {

  val dark  = new Background("dark")
  val light = new Background("light")

  val default = dark

  val all = List(
    default,
    light,
    new Background("transp"),
    new Background("custom"),
  )

  lazy val allByKey = all map { c =>
    c.key -> c
  } toMap

  def apply(key: String) = allByKey.getOrElse(key, default)

  def contains(key: String) = allByKey contains key
}

case class CustomBackground(
    light: Boolean,
    bgPage: String,
    font: String,
    accent: String,
    primary: String,
    secondary: String,
    brag: String,
    green: String,
    red: String,
) {
  def toVars =
    List(
      s"--custom-bg-page: $bgPage;",
      s"--custom-font: $font;",
      s"--custom-accent: $accent;",
      s"--custom-primary: $primary;",
      s"--custom-secondary: $secondary;",
      s"--custom-brag: $brag;",
      s"--custom-green: $green;",
      s"--custom-red: $red;",
    ).mkString("")
}
