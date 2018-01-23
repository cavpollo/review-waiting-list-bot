'use strict'

const SlackBot = require('./SlackBot')
const GitHubApiClient = require("./GitHubApiClient")
const PullRequests = require('./PullRequests')
const Parser = require('./Parser')
const _ = require('lodash')

const workMessage = ['Chop chop, people!',
    'Hey, those PRs won\'t get approved by themselves. Go! Go! Go!',
    'Paging Dr. Reviewer, Paging Dr. Reviewer. The patient needs 10cc of reviews, stat!',
    'I don\'t want to point any fingers, but we need more eyeballs here.',
    'Tip: If you are too busy, just look for a missing `final` and reject the PR, it will buy you more time. ;D',
    'I don\'t get paid enough for this... do I even get paid at all?',
    'It is not easy being a passive-aggressive nagging parrot bot, but someone has to do it.',
    'Don\'t forget checking for code formatting, or the next thing we know we will be using tab indentation! Oh, the horror!',
    'This service was brought to you by "The Cult of the Parrot". The only cult were partying is encouraged.',
    'For the holy party parrot in the sky, please let these PRs be less than 10 files each :pray:',
    'It could be worse, you know? You could be forced to do QA to this code... :cold_sweat:',
    'I think I speak on behalf of everyone when I say, that we would be much honored if you people could critique this beautiful pieces of art.',
    'Keep up to date and download our super mega awesome PR Tracker™ Chrome Extension, it *almost* works!!!: https://chrome.google.com/webstore/detail/pr-tracker/lmjciebmhhokgndbcibahccbdahlddli']

const nothingMessage = ['Nothing to see here. Move along, move along.',
    'Don\'t forget to tag your peers for code reviews, or they won\'t get the sweet pleasure of being pestered by me!',
    'Remember to tag your PRs... or I will ignore them like I did just now ¬¬.',
    'So this is what they mean by "The calm before the storm"...',
    'Huh, nothing... I guess everyone is busy coding... right? RIGHT?!',
    'Ignore me, I\'m just a bot, and bots don\'t have feelings... :sad_parrot:',
    'Oh, crackers... I hate when this happens. I mean, when I don\'t get to give you orders.',
    'Don\'t blame me if your PR is not listed here. I\'m just a parrot that doesn\'t know what he is doing most of the time.',
    'Now would be a good time to be grateful for my altruistic services. I accept credit cards and all cryptocurrencies.',
    'I wish I had fingers to code... I would help to pair program, or even code review. Imagine the possibilities!']

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
          var botMessage = ':warning: Attention! :warning:\nThese PRs with label ' + label.value.join(', ') + ' need to be reviewed:\n'
          _.each(prMessages, (prMessage) => botMessage += prMessage + '\n')
          botMessage += '\n:party_parrot: ' + getRandomMessage(workMessage)

          bot.reply({channel: message.channel}, {'text': botMessage, 'link_names': 1, 'parse': 'full', 'attachments': []})
        } else {
          convo.say('No pull requests with label \' + label.value.join(\', \') + \' for now! :party_parrot:\n' + getRandomMessage(nothingMessage))
        }

        convo.next()
      })
    })
  }
}

function getRandomMessage(messages){
    return messages[Math.floor(Math.random() * messages.length)]
}

module.exports = App
