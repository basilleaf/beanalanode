/*jslint node: true */
"use strict";

var noble = require('noble');
var beanAPI = require('ble-bean/lib/bean');

var connectedBean;
var intervalId;

var readyBean = function() {

  connectedBean.on("accell", function(x, y, z, valid){
    var status = valid ? "valid" : "invalid";
    console.log("received " + status + " accell\tx:\t" + x + "\ty:\t" + y + "\tz:\t" + z );
  });

  intervalId = setInterval(function() {

    connectedBean.requestAccell(
    function(){
      console.log("requested accell");
    });

  },1000 * 3);

};



var connect = function(err){
  if (err) throw err;
  process.on('SIGINT', exitHandler.bind({peripheral:this.peripheral}));

  this.peripheral.discoverServices([], setupService);
};

var setupService = function(err,services) {
  if (err) throw err;
  services.forEach(function(service){
    if(service.uuid === beanAPI.UUID){
      connectedBean = new beanAPI.Bean(service);
      connectedBean.on('ready', readyBean);
    }
  });

};

var discover = function(peripheral){
  console.log("(scan)found:" + peripheral.advertisement.localName);
  noble.stopScanning();
  peripheral.connect(connect.bind({peripheral:peripheral}));
};

noble.startScanning([beanAPI.UUID]);
noble.on('discover', discover);

var getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

process.stdin.resume();//so the program will not close instantly
var triedToExit = false;

//turns off led before disconnecting
var exitHandler = function exitHandler() {

  var self = this;
  if (this.peripheral && !triedToExit) {
    triedToExit = true;
    console.log('Disconnecting from Device...');
    clearInterval(intervalId);
    connectedBean.setColor(new Buffer([0x00,0x00,0x00]), function(){
      self.peripheral.disconnect( function(){
          console.log('disconnected');
          process.exit();
      });
    });
  } else {
    process.exit();
  }
};
