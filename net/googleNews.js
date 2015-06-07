var r  = require('../node_modules/request');
var q  = require('../node_modules/q');
var f  = require('../node_modules/feed-read');
var nr = require('../node_modules/node-readability');
var rl = require('../node_modules/readline-sync');
var h  = require('../node_modules/htmlstrip-native');
var io = require('fs');

var o  = { include_script: false, include_style: false, compact_whitespace: true };
var strip = function(text) {
  try {
    text = h.html_strip(text,o);
    return text;
  } catch(ex) { return 'parse failure: ' + ex + ' for '  + text; }
};

var cs = function() { process.stdout.write("\u001b[2J\u001b[0;0H"); };

exports.queryNews = function() {
  console.log("queryNews()..");
  
  var d = q.defer();
  try {
    console.log('\n');
    // var quit = rl.keyInYN('quit? ');
    // if(quit) running = false;
    // rl.keyInPause(); // <--- this is big
    var keywords = rl.question("what are the keywords for search? ");
    var url = buildUrl(keywords);
    console.log(url);
    f(url,function(err, articles) {
      if(err) { console.log('feed-read() err: %s', err); d.reject({msg:"queryNew().feed-read() error", err: err}); } 
      else {
        if(articles.length === 0) {
          console.log('no articles returned..');
          d.reject({msg: "no articles returned"});
        } else {
          console.log('%s articles found!', articles.length);
          articles.sort(function(a,b){ return new Date(b.published) - new Date(a.published); });
          var sArticles = [];
          articles.forEach(function(article) { sArticles.push(JSON.stringify(article, null ,2));  });
          procArticles(sArticles)
            .then(function(lastArticle) {
              console.log('procArticles().then()..');
              // readArticlesS is the last in the chain, no forward propogation.
              io.writeFile('queries/' + keywords + '.json', JSON.stringify(finishedArtciles,null,2),
                function(err) {
                  if(err) { console.log("write error..\n%s", JSON.stringify(err,null,2)); }
                  else { console.log("Save successful"); }
                });
              displayLoop(finishedArtciles);
              rl.keyInPause();
            }).catch(function(err){
              console.log('error:\n%s', err);
            }) ;
          // procArticles(sArticles)
          //   .then(function(result) {
          //     console.log('procArticles() result\n%s', JSON.stringify(result,null,2));
          // }, function(err) { console.log("error: %s", error);});
          
          // var index = 1;
          // articles.forEach(function(article){
          //   var d = new Date(article.published);
          //   console.log("%s) %s: %s",index, d.toLocaleString(), article.title);
          //   index++;
          // });
          // var articleIndex = rl.keyIn('Which Article :', {limit: '${1-' + articles.length + '}'});
          // console.log("you chose #%s.\n%s",articleIndex, articles[articleIndex-1].title);
          // readArticle(articles[articleIndex - 1].link)
          //   .then(function(result) {
          //     d.resolve();
          //   }, function(err) {d.reject(err);});
          d.resolve(articles);
        }
      }
    });
  } catch(ex) { d.reject({msg: "", ex: ex}); }
  return d.promise;
};

var finishedArtciles = [];

var procArticles = function(articles) {
  var d = q.defer();
  try {
    var lastPromise = articles.reduce(function(promise, article) {
      return promise.then(function() {
        return procArt(article);
      });
    }, q.resolve());
    lastPromise
      .then(function(results) {
        //console.log("lastPromise.then(results)\n%s", JSON.stringify(results,null,2));
        
        d.resolve(results);
      }).catch(function(err) {
        d.reject({msg:"lastPromise().catch() error", err: err});
        console.log(err);
      });
  } catch(ex) { 
    console.log("procArticles() exception:\n%s", ex); 
    d.reject({msg: "procArticles() exception", ex: ex});
  }
  return d.promise;
};

var procArt = function(sArticle) {
  var d = q.defer();
  try {
    var oArt = JSON.parse(sArticle);
    nr(oArt.link,function(err, article, meta){
      if(err) {
        console.log('node-readability error: %s\n', JSON.stringify(err,null,2));
        d.reject({msg: "", err: err});
      } else if(!article.content) {
        console.log('node-readablity returned false.');
        d.resolve({msg: "node-readability could not parse the article."});
      } else {
        console.log("success");
        oArt.text = strip(article.content);
        if(oArt !== undefined)
          finishedArtciles.push(oArt);
        d.resolve(JSON.stringify(oArt,null,2));
      }
    });
  } catch(ex) { d.reject({msg: "procArt() Exception.", ex: ex}); }
  return d.promise;
};

var displayLoop = function(articles) {
  // sort the articles
  articles.sort(function(a,b){ return new Date(b.published) - new Date(a.published); });
  console.log("\n\n%s\n\n", JSON.stringify(articles,null,2));
  
  var quit = false;
  while(!quit) {
    cs();
    displayArticles(articles);
    var chosen = rl.keyIn('Which Article? :', {limit: '${1-' + articles.length + '}'});
    //console.log(JSON.stringify(articles[chosen -1], null ,2));
    console.log("\n%s\n\t%s\n%s\n", articles[chosen].title,articles[chosen].published, articles[chosen].text );
    // if(typeof articles[chosen].title === undefined) {
    //   console.log(JSON.stringify(articles[chosen], null ,2));
    // } else {
    //   console.log("%s\n\t%s\n%s", articles[chosen].title,articles[chosen].published, articles[chosen].text );
    // }
    if(rl.keyInYN('again?')) {
      quit = false;
    } else {
      return;
    }
  }
};

var displayArticles = function(articles) {
  var index = 1;
  articles.forEach(function(article){
    var d = new Date(article.published);
    console.log("%s) %s: %s",index, d.toLocaleString(), article.title);
    index++;
  });
};

var readArticle = function(link) {
  console.log('readArticle(): %s\n', link);
  var d = q.defer();
  try {
    nr(link,function(err, article, meta){
      if(err) {
        console.log('node-readability error: %s\n', err);
        d.reject({msg: "", err: err});
      } else if(!article.content) {
        console.log('node-readablity returned false.');
        d.reject({msg: "node-readability could not parse the article."});
      } else {
        console.log("success");
        d.resolve(strip(article.content));
      }
    });
  } catch(ex) { d.reject({msg: "readArticle() exception", ex: ex}); }
  return d.promise;
};

var buildUrl = function(keywords) {
  console.log('buildUrl(%s)', keywords);
  try {
    while(keywords.indexOf(' ') > -1) { keywords = keywords.replace(' ', '+'); }
    console.log(keywords);
    return "https://news.google.com/news?pz=1&num=5&cf=all&ned=us&hl=en&cf=all&output=rss&q=" + keywords;
  } catch(ex) {console.log("buildUrl() ex: %s", ex);}
};