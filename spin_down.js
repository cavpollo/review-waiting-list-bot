const Heroku = require('heroku-client')
const heroku = new Heroku({token: process.env.HEROKU_API_TOKEN})

heroku.patch('/apps/' + process.env.APP_NAME + '/formation/worker', {
    body: {
        'quantity': 0,
        'size': 'hobby',
    },
}).then(app => {
    console.log('SpinDown:')
    console.log(app)
})