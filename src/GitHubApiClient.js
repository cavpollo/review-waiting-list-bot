'use strict'

const max_page_size = 100
const octokit = require("@octokit/rest")()
const _ = require("lodash")

class GitHubApiClient {
    constructor() {
        const AUTH_TOKEN = process.env.GITHUB_AUTH_TOKEN

        if (AUTH_TOKEN) {
            octokit.authenticate({type: "oauth", token: AUTH_TOKEN})
        }

        this.userMapping = JSON.parse(process.env.USER_MAPPING || '{}')

        _.bindAll(this, ['getAllPullRequests', 'getReviewRequestsForPullRequest', 'getReviewRequestPromise', 'getOrganizationOpenPullPromise', 'getRequestedReviewer', 'isPullRequestCritical'])
    }

    async getOrganizationOpenPullPromise(organization) {
        const query = `type:pr+state:open+org:${organization}`
        return octokit.search.issues({q: query, per_page: max_page_size, sort: 'updated', order: 'desc'})
    }

    async getReviewRequestPromise(pullRequest) {
        const pullRequestUrlSplit = pullRequest.url.split('/')
        const reviewRequestBody = {
            owner: pullRequestUrlSplit[pullRequestUrlSplit.length - 4],
            repo: pullRequestUrlSplit[pullRequestUrlSplit.length - 3],
            number: parseInt(pullRequestUrlSplit[pullRequestUrlSplit.length - 1]),
        }

        const reviewsPromise = octokit.pullRequests.getReviewRequests(reviewRequestBody)

        return reviewsPromise
    }

    async getReviewRequestsForPullRequest(pullRequest) {
        const reviewRequestsResponse = await this.getReviewRequestPromise(pullRequest)
        const reviewRequests = reviewRequestsResponse.data.users

        pullRequest.tagged = reviewRequests.map(this.getRequestedReviewer)
        return pullRequest
    }

    async getAllPullRequests(organization, labels) {
        let pullRequestsResponse = await this.getOrganizationOpenPullPromise(organization)

        console.log(pullRequestsResponse.data.total_count + ' Pull Requests Found')

        let pullRequests = pullRequestsResponse.data.items

        while (octokit.hasNextPage(pullRequestsResponse)) {
            console.log('Paginating...')

            pullRequestsResponse = await octokit.getNextPage(pullRequestsResponse)
            pullRequests = pullRequests.concat(pullRequestsResponse.data.items)
        }

        if (labels.length > 0) {
            pullRequests = pullRequests.filter(pr => this.pullRequestContainsLabel(pr, labels))

            console.log(pullRequests.length + ' Pull Requests Matched Label')
        }

        pullRequests = pullRequests.map(this.isPullRequestCritical)

        await Promise.all(pullRequests.map(this.getReviewRequestsForPullRequest))

        pullRequests = pullRequests.filter(this.isAnyBodyTagged)

        console.log(pullRequests.length + ' Pull Requests Matched Review Request')

        return pullRequests
    }

    pullRequestContainsLabel(pullRequest, labels) {
        const pullRequestLabels = pullRequest.labels
        if (pullRequestLabels.length === 0) {
            return false
        }

        return pullRequestLabels.some((pullRequestLabel) => labels.indexOf(pullRequestLabel.name) >= 0)
    }

    isPullRequestCritical(pullRequest) {
        pullRequest.critical = this.pullRequestContainsLabel(pullRequest, 'CRITICAL')

        return pullRequest
    }

    getRequestedReviewer(requestedReviewer) {
        const githubUsername = requestedReviewer.login
        const slackUsername = this.userMapping[githubUsername]
        return '@' + (slackUsername === undefined ? githubUsername : slackUsername)
    }

    isAnyBodyTagged(pullRequest) {
        return pullRequest.tagged !== undefined && pullRequest.tagged.length > 0
    }
}

module.exports = GitHubApiClient
