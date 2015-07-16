var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var socket = require('socket.io');
var redis = require('redis');
var redisClient = redis.createClient(6379,'192.168.1.15');
redisClient.on('connect', function() {
    console.log('connected redis server');
});

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname,'bower_components')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var server = app.listen(3000, function () {
  console.log('Example app listening at port %d', 3000);
});

var messages = [];
var io = socket.listen(server);
io.sockets.on('connection', function(client){
    console.log('client connected');
    
    client.on('join',function(name){
        
        client.nickname = name;
        redisClient.lrange("meessages",0, -1, function(err, data){
            messages = data.reverse();
            if(messages.length > 0){
                 messages.forEach(function(item){
                    client.emit('messages',item);
                });
            }
        });
        
    });
    
    client.on('messages',function(data){
        var name = client.nickname;
        client.emit('messages',name +' : '+ data);
        client.broadcast.emit('messages',name +' : '+ data);
        storeMessage(name +' : '+ data);
    });
   
});

function storeMessage(data){
    redisClient.lpush("meessages",data);
}

module.exports = app;
