'use strict'

class Parser {
    constructor(args) {
        this.args = args
        this.argTypes = {
            organization: 'single',
            labels: 'multiple',
        }
    }

    parse() {
        return {
            organization: this.extractOrganization('author', 'organization'),
            labels: this.extractLabels('label', 'labels'),
        }
    }

    extract(argName) {
        const type = this.argTypes[argName]

        let argValue = (type === 'multiple' ? [] : '')

        var regexp = new RegExp()
        if (type === 'multiple') {
            regexp = new RegExp(`${argName}:["']([A-z0-9-_,/ ]+)["']`)
        } else if (type === 'single') {
            regexp = new RegExp(`${argName}:["']([A-z0-9-_/ ]+)["']`)
        }

        const matched = this.args.match(regexp)

        if (matched) {
            if (type === 'multiple') {
                argValue = matched[1].split(',').map(match => match.trim())
            } else if (type === 'single') {
                argValue = matched[1].trim()
            }
        }

        return argValue
    }

    extractOrganization(deprecatedArgName, newArgName) {
        const regexp = new RegExp(`${deprecatedArgName}:([A-z0-9-_/]+)`)

        const matched = this.args.match(regexp)

        if (matched) {
            return matched[1].split('/')[0]
        }

        return this.extract(newArgName)
    }

    extractLabels(deprecatedArgName, newArgName) {
        const regexp = new RegExp(`${deprecatedArgName}:([A-z0-9-_/]+)`)

        const matched = this.args.match(regexp)

        if (matched) {
            return matched[1].split(',').map(match => match.split('_').join(' '))
        }

        return this.extract(newArgName)
    }
}

module.exports = Parser
