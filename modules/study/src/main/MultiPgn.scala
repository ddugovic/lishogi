package lila.study

case class MultiKif(value: List[String]) extends AnyVal

object MultiKif {

  private[this] val splitPat = """\n\n(?=\[)""".r.pattern
  def split(str: String, max: Int) =
    MultiKif {
      splitPat.split(str.replaceIf('\r', ""), max + 1).take(max).toList
    }
}
