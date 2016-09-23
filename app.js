var $Spider = require("./src/scripts/spider.js");
var $Downloader = require("./src/scripts/downloader.js");
var $colors = require("colors");

var spider = new $Spider();
var downloader = new $Downloader();

spider.request(function getFetchUrls() {
  // var fetchUrls = ["http://crashr.lofter.com"];
  var fetchUrls = [];

  // 从命令行获取
  if (process.argv.length > 2) {
    for (var i = 2, argvLen = process.argv.length; i < argvLen; i++) {
      var url = process.argv[i];
      if (fetchUrls.indexOf(url) === -1) {
        fetchUrls.push(url);
      }
    }
  }

  return fetchUrls;
});

spider.on("imageUrls", function(urls) {
  // console.log("->image urls:", urls);
  downloader.download(urls);
});

spider.on("pageUrls", function(urls) {
  // console.log("->page urls:", urls);
});

spider.on("finish", function() {
  console.log("spider completed!".green);
});
