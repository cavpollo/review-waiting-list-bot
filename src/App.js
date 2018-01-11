'use strict'

const SlackBot = require('./SlackBot')
const GitHubApiClient = require("./GitHubApiClient")
const PullRequests = require('./PullRequests')
const Parser = require('./Parser')
const _ = require('lodash')

class App {
  static start() {
    const controller = new SlackBot().getController()

    controller.hears("ls (.+)", ["direct_message", "direct_mention", "mention"], this.ls)
  }

  static ls(bot, message) {
    const {authors, owner, repo, label} = new Parser(message.match[1]).parse()

    const client = new GitHubApiClient()

    client.getAllPullRequests(authors).then((prs) => {
      bot.startConversation(message, (err, convo) => {
        const prMessages = new PullRequests(prs, owner, repo, label).convertToSlackMessages()

        if (prMessages.length > 0) {
          var botMessage = ':warning: Attention! :warning:\nThese PRs need to be reviewed:\n'
          _.each(prMessages, (prMessage) => botMessage += prMessage + '\n')
          botMessage += '\nChop chop, people! :party_parrot:'

          bot.reply({channel: message.channel}, {'text': botMessage, 'link_names': 1, 'parse': 'full', 'attachments': []})
        } else {
          convo.say('No pull requests for now! :party_parrot:\nNothing to see here. Move along, move along.')
        }

        convo.next()
      })
    })
  }
}

module.exports = App
