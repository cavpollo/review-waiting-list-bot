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

        this.userMapping = JSON.parse(process.env.USER_MAPPING || '{}')

        _.bindAll(this, ['getAllPullRequests', 'getReviewRequestsForPullRequest', 'getReviewRequestPromise', 'getOrganizationOpenPullPromise', 'getRequestedReviewer'])
    }

    async getOrganizationOpenPullPromise(organization) {
        const query = `type:pr+state:open+org:${organization}`
        return this.github.search.issues({q: query})
    }

    async getReviewRequestPromise(pullRequest) {
        const pullRequestUrlSplit = pullRequest.url.split('/')
        const reviewRequestBody = {
            owner: pullRequestUrlSplit[pullRequestUrlSplit.length - 4],
            repo: pullRequestUrlSplit[pullRequestUrlSplit.length - 3],
            number: parseInt(pullRequestUrlSplit[pullRequestUrlSplit.length - 1]),
        }

        const reviewsPromise = this.github.pullRequests.getReviewRequests(reviewRequestBody)

        return reviewsPromise
    }

    async getReviewRequestsForPullRequest(pullRequest) {
        const reviewRequestsResponse = await this.getReviewRequestPromise(pullRequest)
        const reviewRequests = reviewRequestsResponse.data.users

        pullRequest.tagged = reviewRequests.map(this.getRequestedReviewer)
        return pullRequest
    }

    async getAllPullRequests(organization, labels) {
        const pullRequestsResponse = await this.getOrganizationOpenPullPromise(organization)

        // console.log(pullRequestsResponse.data.total_count + ' Pull Requests Found for [' + organization + '][' + labels.join(',') + ']!')

        const pullRequests = pullRequestsResponse.data.items

        var filteredPullRequests = pullRequests

        if (labels.length > 0) {
            filteredPullRequests = pullRequests.filter(pr => this.pullRequestContainsLabel(pr, labels))

            // console.log(filteredPullRequests.length + ' Pull Requests Matched Label for [' + organization + '][' + labels.join(',') + ']!')
        }

        await Promise.all(filteredPullRequests.map(this.getReviewRequestsForPullRequest))

        filteredPullRequests = filteredPullRequests.filter(this.isAnyBodyTagged)

        // console.log(filteredPullRequests.length + ' Pull Requests Matched Review Request for [' + organization + '][' + labels.join(',') + ']!')

        return filteredPullRequests
    }

    pullRequestContainsLabel(pullRequest, labels) {
        const pullRequestLabels = pullRequest.labels
        if (pullRequestLabels.length === 0) {
            return false
        }

        return pullRequestLabels.some((pullRequestLabel) => labels.indexOf(pullRequestLabel.name) >= 0)
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
