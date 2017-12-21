'use strict'

const GitHubApi = require("github")
const _ = require("lodash")

class GitHubApiClient {
  constructor() {
    this.github = new GitHubApi({
      debug: !!process.env.DEBUG,
      timeout: 5000,
    })

    const AUTH_TOKEN = process.env.GITHUB_AUTH_TOKEN

    if (AUTH_TOKEN) {
      this.github.authenticate({type: "oauth", token: AUTH_TOKEN})
    }

    this.userMapping = JSON.parse(process.env.USER_MAPPING)

    _.bindAll(this, ['getPullRequestsForAuthor', 'getTeamMembers', 'isTeam', 'getAllPullRequests', 'getPullRequestsForTeamOrAuthor', 'getReviewRequestsForPullRequests', 'getPullRequestReviews', 'getRequestedReviewer'])
  }

  getPullRequestsForAuthor(author) {
    return this.github.search.issues({q: `type:pr+state:open+author:${author}`})
  }

  getPullRequestReviews(prData) {
    return this.github.pullRequests.getReviewRequests({owner: prData.owner, repo: prData.repo, number: prData.number})
  }

  getRequestedReviewer(requested_reviewer) {
      const githubUsername = requested_reviewer.login
      const slackUsername = this.userMapping[githubUsername]
      return '@' + (slackUsername === undefined ? githubUsername : slackUsername)
  }

  async getReviewRequestsForPullRequests(prItem) {
      const prUrlSplit = prItem.url.split('/')
      const prData = [{owner: prUrlSplit[prUrlSplit.length-4], repo: prUrlSplit[prUrlSplit.length-3], number: parseInt(prUrlSplit[prUrlSplit.length-1]) }]

      const reviewRequests = await Promise.all(prData.map(this.getPullRequestReviews))

      var flatReviewRequests = _.flattenDeep(reviewRequests)
      prItem.tagged = _.flatMap(flatReviewRequests, (prs) => prs.data.users).map(this.getRequestedReviewer)
      return prItem
  }

  async getTeamMembers(teamNameWithOrg) {
    const [orgName, teamSlug] = teamNameWithOrg.split('/')
    const teams = await this.github.orgs.getTeams({org: orgName, per_page: 100})
    const team = _.find(teams.data, { slug: teamSlug })

    const teamMembers = await this.github.orgs.getTeamMembers({id: team.id})
    return teamMembers.data.map((member) => member.login)
  }

  async getPullRequestsForTeamOrAuthor(author) {
    if (this.isTeam(author)) {
      const teamMembers = await this.getTeamMembers(author)
      return Promise.all(_.flatMap(teamMembers, this.getPullRequestsForAuthor))
    } else {
      return this.getPullRequestsForAuthor(author)
    }
  }

  async getAllPullRequests(authors) {
    const prs = await Promise.all(authors.value.map(this.getPullRequestsForTeamOrAuthor))
    var flatPrs = _.flattenDeep(prs)
    var prItems = _.flatMap(flatPrs, pr => pr.data.items)
    await Promise.all(prItems.map(this.getReviewRequestsForPullRequests))
    return flatPrs
  }

  isTeam(author) {
    return !!author.match(/^.+\/.+$/)
  }
}

module.exports = GitHubApiClient
