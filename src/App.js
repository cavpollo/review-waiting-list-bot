'use strict'

const SlackBot = require('./SlackBot')
const GitHubApiClient = require("./GitHubApiClient")
const Parser = require('./Parser')

const workMessage = ['Chop chop, people!',
    'Ha! And you thought your day couldn\'t get any more boring...',
    'Are you ready?! It\'s time to... re-re-re-reviewwwww!',
    'Hey, those PRs won\'t get approved by themselves. Go! Go! Go!',
    'Paging Dr. Reviewer, Paging Dr. Reviewer. The patient needs 10cc of reviews, stat!',
    'Whenever a PR goes unreviewed for more than a couple hours, a programmer gets bored and starts coding yet another CMS/ERP system. Please, let this madness stop!',
    'I don\'t want to point any fingers, but we need more eyeballs here.',
    'Tip: If you are too busy, just look for a missing `final` and reject the PR, it will buy you more time.',
    'Tip: If you think the reviewer\'s change request are annoying, just dismiss his opinions with an "Out of scope". Works. Every. Time.',
    'I don\'t get paid enough for this... do I even get paid at all?',
    'Roses are red.\nViolets are blue.\nI see you are bored.\nHere\'s some code to review.',
    'It\'s all fun and games until somebody gets his PR closed. Remember to check CircleCI\' status before submitting PRs for review.',
    'My parrot sense is tingling! I sense some smelly code!',
    'It is not easy being a passive-aggressive nagging parrot bot, but someone has to do it.',
    'Remember people, quality over quantity. It doesn\'t matter if you edit 100+ files if they are all sparkly :sparkles:.',
    'Don\'t forget checking for code formatting, or the next thing we know we will be using tab indentation! Oh, the horror!',
    'Now would be a good time to reflect on your career choice. Pizza parlors are more profitable. Just saying...',
    'Can somebody program me so that I can comment on those code reviews. I really wan\'t to help...',
    '♪ Wake me uuuuup, when the code review ends ♫',
    'And remember, your code should be like abstract art. The less we see of it, the better.',
    'Remember to give your best by coding like there was no tomorrow. Just like our deadlines...',
    'This service was brought to you by "The Cult of the Parrot". The only cult were partying is encouraged.',
    'Think about this for a second: If the company starts paying by commit, then every time changes are requested, the richer you\'ll become. +Mindblown+ ',
    'For the holy party parrot in the sky, please let these PRs be less than 10 files each :pray:.',
    '//TODO write something funny and witty.',
    'Quick, look inside the PRs! I think I saw some promotional coupons for Hooters!',
    '-Knock knock. -Who\'s there? -Review. -Review who? -Review those PRs awaiting for your "invaluable expertise"!',
    'Could somebody show some mercy and put these PRs out of their misery? I mean, just look at them.',
    'It could be worse, you know? You could be forced to do QA to this code... :cold_sweat:',
    'Do you ever wonder why I seem to be saying the same things over and over again? Well, that\'s what a parrot does best, duh.',
    'If your review comment is more than 5 lines long, you are doing something wrong.',
    'Oh, these PRs? No, they are not important, pffff. It is not as if the pipeline was stopped because it needs your approval. That\'s crazy talk.',
    'I came here to chew gum and pester you about the pending PRS, and I\'m all out of bubble gum.',
    'I think I speak on behalf of everyone when I say, that we would be much honored if you people could critique this beautiful pieces of art.',
    'Keep up to date and download our super mega awesome PR Tracker™ Chrome Extension, it *almost* works!!!: https://chrome.google.com/webstore/detail/pr-tracker/lmjciebmhhokgndbcibahccbdahlddli']

const nothingMessage = ['Nothing to see here. Move along, move along.',
    'Don\'t forget to tag your peers for code reviews, or they won\'t get the sweet pleasure of being pestered by me!',
    'Remember to tag your PRs... or I will ignore them like I did just now ¬¬.',
    'So this is what they mean by "The calm before the storm"...',
    'Huh, nothing... I guess everyone is busy coding... right? RIGHT?!',
    'Did somebody say "Pericos"?',
    'Ignore me, I\'m just a bot, and bots don\'t have feelings... :sad_parrot:',
    'I\'m secretly dancing to the rhythm of La Macarena. Please don\'t tell anyone.',
    'Oh, crackers... I hate when this happens. I mean, when I don\'t get to give you orders.',
    'Making a PR to fix a typo on the Linux repo is poor attempt at adding "Linux Kernel maintainer" to one\'s CV... Just so you know. Definitely not something from personal experience.',
    'Don\'t blame me if your PR is not listed here. I\'m just a parrot that doesn\'t know what he is doing most of the time.',
    'Now would be a good time to be grateful for my altruistic services. I accept credit cards and all cryptocurrencies.',
    'I wish I had fingers to code... I would help to pair program, or even code review. Imagine the possibilities!']

class App {
  static start() {
    const controller = new SlackBot().getController()

    controller.hears("ls (.+)", ["direct_message", "direct_mention", "mention"], this.ls)
  }

  static ls(bot, message) {
    const {organization, labels} = new Parser(message.match[1]).parse()

    console.log('Filtering requests for [Org:' + organization + '][Labels:' + labels.join(',') + ']!')

    const client = new GitHubApiClient()

    client.getAllPullRequests(organization, labels).then((pullRequests) => {
        if (pullRequests.length > 0) {
            var botMessage = ':warning: Attention! :warning:\nThese PRs with labels ' + labels.join(', ') + ' need to be reviewed:\n'
            botMessage += pullRequests.map(formatPullRequest).join('\n')
            botMessage += '\n\n:party_parrot: ' + getRandomMessage(workMessage)

            bot.reply({channel: message.channel}, {'text': botMessage, 'link_names': 1, 'parse': 'full', 'attachments': []})
        } else {
            bot.reply({channel: message.channel}, {'text': 'No pull requests with labels ' + labels.join(', ') + ' for now! :party_parrot:\n' + getRandomMessage(nothingMessage)})
        }

        console.log('Done notifying')
    })
    .catch(function(error){
        console.error("Fatal error =(")
        console.error(error)

        bot.reply({channel: message.channel}, {'text': 'Sorry, something went wrong and I don\'t know how to fix it... I\'m just a parrot :sad_parrot:'})
    })
  }
}

function formatPullRequest(pullRequest) {
    return `${pullRequest.critical ? ':sos:' : ''} \`${pullRequest.title}\` ${pullRequest.tagged ? pullRequest.tagged.join(' ') : ''} - ${pullRequest.html_url}`
}

function getRandomMessage(messages){
    return messages[Math.floor(Math.random() * messages.length)]
}

module.exports = App
