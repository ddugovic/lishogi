package lila.tournament
package arena

import lila.common.Chronometer
import lila.common.WMMatching
import lila.tournament.arena.PairingSystem.Data
import lila.user.User

private object AntmaPairing {

  def apply(data: Data, players: RankedPlayers): List[Pairing.Prep] =
    players.nonEmpty ?? {
      import data._

      def rankFactor = PairingSystem.rankFactorFor(players)

      def justPlayedTogether(u1: User.ID, u2: User.ID) =
        lastOpponents.hash.get(u1).contains(u2) ||
          lastOpponents.hash.get(u2).contains(u1)

      def pairScore(a: RankedPlayer, b: RankedPlayer): Option[Int] =
        if (justPlayedTogether(a.player.userId, b.player.userId)) None
        else if (data.tour.isTeamBattle && a.player.team == b.player.team) None
        else
          Some {
            Math.abs(a.rank - b.rank) * rankFactor(a, b) +
              Math.abs(a.player.rating - b.player.rating)
          }

      def duelScore: (RankedPlayer, RankedPlayer) => Option[Int] = (_, _) => Some(1)

      Chronometer.syncMon(_.tournament.pairing.wmmatching) {
        WMMatching(
          players.toArray,
          if (data.onlyTwoActivePlayers) duelScore
          else pairScore,
        ).fold(
          err => {
            logger.error("WMMatching", err)
            Nil
          },
          _ map { case (a, b) =>
            Pairing.prep(tour, a.player, b.player)
          },
        )
      }
    }
}
