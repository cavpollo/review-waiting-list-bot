const Heroku = require('heroku-client')
const heroku = new Heroku({ token: process.env.HEROKU_API_TOKEN })

heroku.patch('/apps/' + process.env.APP_NAME + '/formation/worker', {
    body: {
        'quantity': 1,
        'size': 'hobby',
    },
}).then(app => {
    console.log('SpinUp:')
    console.log(app)
})