package lila

import lila.common.base.StringUtils.escapeHtmlRaw

package object pref extends PackageObject {
  private[pref] def cssBackgroundImageValue(url: String): String =
    if (url.isEmpty || url == "none") "none"
    else s"url(${escapeHtmlRaw(url).replace("&amp;", "&")})"

}
