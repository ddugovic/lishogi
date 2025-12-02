package lila.blog

import play.api.i18n.Lang

sealed abstract class BlogLang(val code: BlogLang.Code) {
  def language = code.take(2)
  def country  = code.takeRight(2)
}

object BlogLang {
  type Code = String

  case object English  extends BlogLang("en-US")
  case object Japanese extends BlogLang("ja-JP")

  case object All extends BlogLang("*")

  val default  = English
  val allLangs = List(English, Japanese)

  def fromLangCode(langCode: Code): BlogLang =
    allLangs.find(l => langCode.toLowerCase.startsWith(l.language)).getOrElse(default)

  def fromLang(lang: Lang): BlogLang =
    fromLangCode(lang.code)

}
