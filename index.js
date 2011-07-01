var http = require('http'),  
    io = require('socket.io'),
    express = require('express'),
    MIDI = require('MIDI'),
    sys=require('sys'),
    twitter=require('twitter'),
    exec = require("child_process").exec,
    events = require('events');
    
//MIDI stuff    
    var midiInput = new MIDI.MIDIInput();
    console.log("opened MIDI input port", midiInput.portName);

    midiInput.on('sysex', function (message, time) {
        console.log('sysex:', MIDI.messageToString(message), 'time', time);
    });
    midiInput.on('timingClock', function (time) {
        console.log('timingClock', 'time', time);
    });

//twitter stuff
var twit = new twitter({
consumer_key: 'MYCONSUMERKEY',
consumer_secret: 'MYCONSUMERSECRET',
access_token_key: '',
access_token_secret: ''
});   
    
//server
var app = express.createServer();
app.use(express.static(__dirname + '/public'));
app.listen(3000);

app.get("/", function(req, res) {
  res.send("test");
});
  
var voices = ["Agnes", "Kathy", "Princess", "Vicki", "Victoria", "Bruce", "Fred", "Junior", "Ralph", "Albert", "'Bad News'", "Bahh", "Bells", "Boing", "Bubbles", "Cellos", "Deranged", "'Good News'", "Hysterical", "'Pipe Organ'", "Trinoids", "Whisper", "Zarvox"];
app.get("/babbly", function(req, res){  
  twit.search('musichackday', {include_entities:true}, function(data) {
    var command = '';
    count = 0;    
    data.results.forEach( function(tweet) {
      count++;
      command = command + 'say "' + 
                tweet.text.replace(/"/,"'").replace(/$/g, ' ').replace(/http:\/\/.*\s/g," url ") + 
                '" -v '+ voices[Math.round(Math.random()*voices.length)] + 
                ' -o public/audio/tweet' + count + '.m4a ;';
    });
    exec(command, function (error, stdout, stderr)
    {
      console.log("babbled " + command);
    });
  });
  res.writeHead(200, {"Content-Type": "text/html"});
  res.write('babbly');
  res.end();
});
  
// socket.io 
var socket = io.listen(app); 
socket.on('connection', function(client){ 
  // new client is here! 
  client.on('message', function(event){ 
    console.log('message from client', event);
  }) 
  client.on('disconnect', function(){
    console.log('disconnect');
  });
  
  // Create periodical which ends a message to the client every 5 seconds
  //var interval = setInterval(function() {
    //console.log("sent " + new Date().getTime());
  //  client.send('received ' + new Date().getTime());
  //}, 1);

  midiInput.on('controlChange', function (controller, value, channel, time) {
      //console.log('controlChange: controller', controller, 'value', value, 'channel', channel, 'time', time);
      var msg = {'controller': controller, 'value': value, 'channel': channel, 'time': time};
      client.send(JSON.stringify(msg));
  });


});



