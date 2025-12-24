package lila.security

import lila.common.IpAddress

final class IpTrust(
    torApi: Tor,
    firewallApi: Firewall,
) {

  def isSuspicious(ip: IpAddress): Boolean =
    if (firewallApi blocksIp ip) true
    else if (torApi isExitNode ip) true
    else false

  def isSuspicious(ipData: UserSpy.IPData): Boolean =
    isSuspicious(ipData.ip.value)

}
