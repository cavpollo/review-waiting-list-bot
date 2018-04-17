# Party Parrots in you Slack review team!

## What's this?

It's a Slack Party Parrot bot to list up review waiting list based on [the original review waiting list bot](https://github.com/ohbarye/review-waiting-list-bot), but simplified for my use case.

## Usage

In your Slack room, just call the bot.

```
/invite @parrotbot
@parrotbot ls organization:"pay-code" labels:"CODE REVIEW"
```

argument | presence | description
--- | --- | ---
organization | Required | Your organization name.
labels | Optional | You can specify multiple labels comma separated.

Also, you'll need to configure the following variables in your Heroku environment:

```
GITHUB_AUTH_TOKEN=987fed
SLACK_BOT_TOKEN=123456
USER_MAPPING={"githubUsername":"slackUserId"}
```

### Tips

You can use this bot even better in combination with the Slack reminder.

For instance, the following reminder setting invokes the bot every weekday 11 am.

```
/remind #general “@parrotbot ls organization:"pay-code" labels:"CODE REVIEW"” at 10am every weekday
```

<img src="http://cultofthepartyparrot.com/parrots/hd/parrot.gif" width="32" height="32">