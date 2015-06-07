// app for code
var rl = require('readline-sync');
var  q = require('q');
var gn = require('./net/googleNews');
var rOptions = ["Explore DB?", "Query news.google.com?", "Find Feeds?"];

var init = function() {
  
  start()
    .then(function() {return;}, function(err) {console.log(JSON.stringify(err,null,2));});
    // .then(function() {return cont(); }, function(err) {})
    // .then(function(again) { if(!again) return; });

};

var cont = function() {
  var d = q.defer();
  try {
    var a = rl.question("go again? (y/n):", {trueValue: ['y', 'Y'], falseValue: ['n', 'N']});
    d.resolve(a);
  }catch(ex) { d.reject(ex); }
  return d.promise;
};

var start = function() {
  process.stdout.write("\u001b[2J\u001b[0;0H");
  console.log("start()");
  var d = q.defer();
  rootOptions()
  .then(function(optionsIndex){
    switch(optionsIndex) {
      case 0:
        option1().then(function(results) {console.log(results.msg); d.resolve();}, function(err) {console.log(err);} );
        break;
      case 1:
        option2().then(function(results) {console.log(results.msg); d.resolve();}, function(err) {console.log(err);} );
        break;
      case 2:
        option3().then(function(results) {console.log(results.msg); d.resolve();}, function(err) {console.log(err);} );
        break;
      default: break;
    }
  },function(err) { d.reject(err);});  
  return d.promise;
};

var option1 = function() {
  var d = q.defer();
  try {
    
    d.resolve({msg: "thank you for playing, exploring the database is coming soon."});
  } catch(ex) { d.reject({msg:"() exception.", ex: ex});}
  return d.promise;
};

var option2 = function() {
  // query news.google.com
  var d = q.defer();
  try {
    gn.queryNews()
      .then(function(results) {
        //console.log(JSON.stringify(results, null, 2));
        d.resolve(results);
        // d.resolve({msg: "thank you for playing, querying news.google.com is coming soon."});
      },function(err) {d.reject(err);})
    
  } catch(ex) { d.reject({msg:"() exception.", ex: ex});}
  return d.promise;
};

var option3 = function() {
  var d = q.defer();
  try {
    d.resolve({msg: "thank you for playing, finding feeds is coming soon."});
  } catch(ex) { d.reject({msg:"() exception.", ex: ex});}
  return d.promise;
};

var rootOptions = function() {
  var d = q.defer();
  try {
    
    var i = rl.keyInSelect(rOptions, "What would you like to do today? ");
    d.resolve(i);
  } catch(ex) {
    d.reject({msg: "rootOptions() exceptiopn", ex: ex}); }
  return d.promise;
};

init();