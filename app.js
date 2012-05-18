/**
 * Module dependencies.
 */

var express = require('express')
, dateformat = require('dateformat')
, routes = require('./routes') //TODO separate routes in specific controllers
, login = require('./routes/login.js')
, resize = require('./lib/resize.js')
;

var RedisStore = require('connect-redis')(express);

var app = module.exports = express.createServer();

// Configuration

app.configure(
    function() {
        app.set('views', __dirname + '/views');
        app.set('view engine', 'ejs');
        app.set('view options', {
            layout: true
        });
        app.use(express.bodyParser());
        app.use(express.cookieParser());
        app.use(express.session({ secret: "cloudstagram secret sauce", store: new RedisStore }));
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.static(__dirname + '/public'));
    }
);

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

function restrict(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}

function loggedoutOnly(req, res, next) {
    if(req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
}

// Routes
app.get('/', routes.index);
app.get('/image/:id', routes.serveFile);
app.get('/images/:userid', routes.userImages);

// Logged out only routes
app.get('/register', loggedoutOnly, login.register);
app.post('/register', loggedoutOnly, login.addUser);
app.get('/login', loggedoutOnly, login.login);
app.post('/login', loggedoutOnly, login.auth);

// Secure routes
app.post('/upload', restrict, routes.upload);
app.get('/logout', restrict, login.logout);

app.listen(3000, function(){
    resize.startConsumers();
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
