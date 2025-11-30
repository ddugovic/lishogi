package lila.msg

// Updated case class to include English and Japanese text
case class MsgPreset(name: String, enText: String, jaText: String)

object MsgPreset {

  val all = List(
    MsgPreset(
      name = "Warning: Offensive language",
      enText = """On Lishogi, you *must* be nice when communicating with other players. At all times.

Lishogi is intended to be a fun and friendly environment for everyone. Please note that repeated violation of chat policy will result in loss of chat privileges.""",
      jaText = """Lishogiでは、他のプレイヤーとコミュニケーションをとる際、*常に*礼儀正しく振る舞ってください。

Lishogiは、すべての人にとって楽しくフレンドリーな環境であることを目指しています。チャットポリシーへの違反を繰り返した場合、チャットの利用権限が剥奪されますのでご注意ください。""",
    ),
    MsgPreset(
      name = "Warning: Sandbagging",
      enText =
        """In your game history, you have several games where you clearly have intentionally lost the game. Attempts to artificially manipulate your own or someone else's rating are unacceptable. If this behavior continues to happen, your account will be terminated.""",
      jaText =
        """あなたの対局履歴に、意図的に負けたと思われる対局がいくつか見受けられます。自分自身や他者のレーティングを不当に操作する行為は容認されません。このような行為が続く場合、アカウントは停止されます。""",
    ),
    MsgPreset(
      name = "Warning: Boosting",
      enText =
        """In your game history, you have several games where the opponent clearly has intentionally lost against you. Attempts to artificially manipulate your own or someone else's rating are unacceptable. If this behavior continues to happen, your account will be terminated.""",
      jaText =
        """あなたの対局履歴に、相手が意図的にあなたに負けたと思われる対局がいくつか見受けられます。自分自身や他者のレーティングを不当に操作する行為は容認されません。このような行為が続く場合、アカウントは停止されます。""",
    ),
    MsgPreset(
      name = "Warning: Excessive draw offers",
      enText =
        """Offering an excessive amount of draws in order to distract or annoy an opponent is not acceptable on Lishogi. If this behavior continues to happen, your account will be terminated.""",
      jaText =
        """相手の気を散らしたり、迷惑をかけたりするために過度に引き分け（千日手）を提案することは、Lishogiでは容認されません。この行為が続く場合、アカウントは停止されます。""",
    ),
    MsgPreset(
      name = "Use /report",
      enText =
        "In order to report players for bad behavior, please visit https://lishogi.org/report",
      jaText = "迷惑行為を行うプレイヤーを報告するには、 https://lishogi.org/report にアクセスしてください。",
    ),
    MsgPreset(
      name = "Use /appeal",
      enText =
        """Your account has been restricted due to continuous violation of Lishogi's Terms of Service. If you would like to contest this mark or apologize for your wrongdoings, please appeal to Lishogi at https://lishogi.org/appeal and we might lift the mark.""",
      jaText =
        """Lishogiの利用規約に継続的に違反したため、あなたのアカウントは制限されました。この処分に異議がある場合、または自身の行為について弁明したい場合は、 https://lishogi.org/appeal から申し立てを行ってください。制限が解除される可能性があります。""",
    ),
    MsgPreset(
      name = "Warning: Accusations",
      enText =
        """Accusing other players of using computer assistance or otherwise cheating is not acceptable on Lishogi. If you are confident that a player is cheating, use the report button on their profile page to report them to the moderators.""",
      jaText =
        """他のプレイヤーがソフト指し（コンピュータ支援）や不正行為をしていると公然と非難することは、Lishogiでは容認されません。もし相手が不正をしていると確信した場合は、プロフィールページの報告ボタンを使用してモデレーターに報告してください。""",
    ),
    MsgPreset(
      name = "Warning: spam is not permitted",
      enText = """Spamming is not permitted on Lishogi.
Do not post anything more than once, in public chats, private chats, forums, or any other communication channel.
Please note that repeated violation of this policy will result in loss of communication privileges.""",
      jaText = """Lishogiではスパム行為は禁止されています。
公開チャット、プライベートチャット、フォーラム、その他の場所を問わず、同じ内容を繰り返し投稿しないでください。
このポリシーへの違反を繰り返した場合、コミュニケーション機能の利用権限が剥奪されますのでご注意ください。""",
    ),
    MsgPreset(
      name = "Regarding rating refunds",
      enText =
        """To receive rating refunds certain conditions must be met, in order to mitigate rating inflation. These conditions were not met in this case.
Please also remember that, over the long run, ratings tend to gravitate towards the player's real skill level.""",
      jaText = """レーティングのインフレを防ぐため、レーティングの返還が行われるには特定の条件を満たす必要があります。今回のケースでは、それらの条件は満たされませんでした。
また、長期的には、レーティングはそのプレイヤーの真の実力に収束する傾向がある点もご留意ください。""",
    ),
    MsgPreset(
      name = "Warning: Inappropriate username",
      enText =
        """Due to the fact that your username is either an inappropriate word/phrase that could be offensive to someone or is impersonating someone that you aren't, your account will be terminated within the next 24 hours.
Once this is done, you will be permitted to create a new lishogi account with a username that follows our Username policy (https://github.com/lichess-org/lila/wiki/Username-policy).""",
      jaText = """あなたのユーザー名が不適切で他人を不快にさせる可能性がある、または他者になりすましていると判断されたため、あなたのアカウントは24時間以内に停止されます。
アカウント停止後、ユーザー名ポリシー (https://github.com/lichess-org/lila/wiki/Username-policy) に従った適切なユーザー名で、新しいLishogiアカウントを作成することが許可されます。""",
    ),
    MsgPreset(
      name = "Warning: Username or profile that implies you are a titled player",
      enText =
        """The username policy (https://github.com/lichess-org/lila/wiki/Username-policy) for Lishogi states that you can't have a username that implies that you have a JSA title or the Lishogi Master title, or impersonating a specific titled player. Actual titled players can verify by contacting us at contact@lishogi.org with evidence that documents their identity, e.g. a scanned ID card, driving license, passport or similar. We will then verify your identity and title, and your title will be shown in front of your username and on your Lishogi user profile. Since your username or profile implies that you have a title, we reserve the right to close your account within two weeks, if you have not verified your title within that time.""",
      jaText =
        """Lishogiのユーザー名ポリシー (https://github.com/lichess-org/lila/wiki/Username-policy) では、日本将棋連盟(JSA)の称号やLishogiマスターの称号を持っていることを示唆するユーザー名、あるいは特定の有段者になりすますことは禁止されています。実際の有段者は、身分証明書、運転免許証、パスポートなどの本人確認書類を添えて contact@lishogi.org まで連絡することで、本人確認を行うことができます。確認が完了すると、ユーザー名の前とプロフィールにタイトルが表示されます。あなたのユーザー名またはプロフィールはタイトル保持者であることを示唆しているため、2週間以内に本人確認が行われない場合、アカウントを閉鎖させていただく場合があります。""",
    ),
    MsgPreset(
      name = "Account marked for computer assistance",
      enText =
        """Our cheating detection algorithms have marked your account for using computer assistance. If you want to contest the mark or apologize for your wrongdoings, please appeal to Lishogi at https://lishogi.org/appeal and we might lift the mark. If you are a very strong player, like a high-ranking amateur or professional player, we will need a proof of your identity. It can be a picture of a document, like an ID card or a driving license. The proof of identity can also happen through Shogi Club 24, if you have an active account there. You can verify your playing strength by contacting us at contact@lishogi.org.""",
      jaText =
        """不正検出アルゴリズムにより、あなたのアカウントにソフト指し（コンピュータ支援）の疑いがかけられました。この判定に異議がある場合、または不正行為について謝罪したい場合は、 https://lishogi.org/appeal から申し立てを行ってください。制限が解除される可能性があります。もしあなたが高段のアマチュアやプロのような非常に強いプレイヤーである場合は、身分証明書（IDカードや運転免許証など）の写真による本人確認が必要です。「将棋倶楽部24」にアクティブなアカウントをお持ちの場合、それを通じて本人確認を行うことも可能です。棋力の証明については、 contact@lishogi.org までお問い合わせください。""",
    ),
    MsgPreset(
      name = "Warning: leaving games / stalling on time",
      enText =
        """In your game history, you have several games where you have left the game or just let the time run out instead of playing or resigning.
This can be very annoying for your opponents. If this behavior continues to happen, we may be forced to terminate your account.""",
      jaText = """あなたの対局履歴に、投了や着手を行わずに意図的に持ち時間を消費させる、または対局を放置したと思われる対局がいくつか見受けられます。
これは対戦相手にとって非常に迷惑な行為です。今後も続くようであれば、アカウントを停止せざるを得ません。""",
    ),
    MsgPreset(
      name = "Warning: Others",
      enText =
        """If you continue to violate Lishogi's Terms of Service (https://lishogi.org/terms-of-service) in any manner, your account will be restricted. Please refrain from doing so.""",
      jaText =
        """今後もLishogiの利用規約 (https://lishogi.org/terms-of-service) に違反し続ける場合、あなたのアカウントは制限されます。そのような行為はお控えください。""",
    ),
  )

  lazy val sandbagAuto = MsgPreset(
    name = "Warning: possible sandbagging",
    enText =
      """You have lost a couple games after a few moves. Please note that you MUST try to win every rated game.
Losing rated games on purpose is called "sandbagging", and is not allowed on Lishogi.

Thank you for your understanding.""",
    jaText = """わずか数手で負けている対局がいくつか見受けられます。レート戦では、常に勝利を目指して最善を尽くさなければなりません。
意図的にレート戦で負ける行為は「サンドバッグ（不当なレート操作）」と呼ばれ、Lishogiでは禁止されています。

ご理解のほどよろしくお願いいたします。""",
  )

  lazy val sittingAuto = MsgPreset(
    name = "Warning: leaving games / stalling on time",
    enText =
      """In your game history, you have several games where you have left the game or just let the time run out instead of playing or resigning.
This can be very annoying for your opponents. If this behavior continues to happen, we may be forced to terminate your account.""",
    jaText = """あなたの対局履歴に、投了や着手を行わずに意図的に持ち時間を消費させる、または対局を放置したと思われる対局がいくつか見受けられます。
これは対戦相手にとって非常に迷惑な行為です。今後も続くようであれば、アカウントを停止せざるを得ません。""",
  )

  def maxFollow(username: String, max: Int) =
    MsgPreset(
      name = "Follow limit reached!",
      enText = s"""Sorry, you can't follow more than $max players on Lishogi.
To follow new players, you must first unfollow some on https://lishogi.org/@/$username/following.

Thank you for your understanding.""",
      jaText = s"""申し訳ありませんが、Lishogiでは${max}人を超えるプレイヤーをフォローすることはできません。
新しいプレイヤーをフォローするには、まず https://lishogi.org/@/$username/following で何人かのフォローを解除する必要があります。

ご理解のほどよろしくお願いいたします。""",
    )

  def byName(s: String) = all.find(_.name == s)
}
