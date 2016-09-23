var $request = require("request");
var $cheerio = require("cheerio");
var $url = require("url");
var $customUtil = require("./custom-util")();
var $EventEmitter = require('events');
var $util = require("util");
var $config = require("../../package.json").appConifg.spider;
var $colors = require("colors");

// Spider constructor
function Spider(params) {
  var obj = {
    fetchedUrlPool: [],
    unfetchedUrlPool: [],
    imageUrlPool: [],
    spiderUrlPool: [],
    baseUrl: null,
    requestMax: 0,
    requestCount: 0,
    manualNext: false,
    pageSelector: "a[href]",
    imageSelector: "img",
    hostWhiteList:[],
    hostBlackList:[],
  };

  $customUtil.merge(this, obj, $config, params);
}

// inherits EventEmitter
$util.inherits(Spider, $EventEmitter);

$customUtil.merge(Spider.prototype, {
  imageUrls: imageUrls,
  pageUrls: pageUrls,
  finish: finish,
  request: request,
  _request: _request,
  catchPageUrls: catchPageUrls,
  catchImageUrls: catchImageUrls,
  getAbsoluteUrl: getAbsoluteUrl,
  next: next,
  saveSpiderUrls: saveSpiderUrls,
});

// exports
module.exports = Spider;

// events
function imageUrls(data) {
  this.emit('imageUrls', data);
}
;

function pageUrls(data) {
  this.emit('pageUrls', data);
}

function finish(data) {
  this.emit('finish', data);
}

function request(urls) {
  this.saveSpiderUrls(urls);
  this.next();
}

function saveSpiderUrls(urls) {
  if ($util.isArray(urls)) {
    for (var i = 0, len = urls.length; i < len; i++) {
      var url = urls[i];
      if (this.unfetchedUrlPool.indexOf(url) < 0) {
        this.unfetchedUrlPool.push(urls[i]);
      }
    }
  } else if ($util.isString(urls)) {
    this.saveSpiderUrls(Array.prototype.slice.call(null))
  } else if ($util.isFunction(urls)) {
    this.saveSpiderUrls(urls());
  }
}

// request
function _request(href) {
  var self = this;

  self.requestCount++;

  href = href || this.baseUrl;
  this.baseUrl = href;
  this.fetchedUrlPool.push(href);
  this.unfetchedUrlPool.remove(href);

  $request({
    uri: href,
    followRedirect: false
  }, function(error, response, body) {
    console.log($colors.inverse.white("+ %s"), href);

    if (error) {
      console.log(error);
    } else if (!error && response.statusCode == 200) {
      var $ = $cheerio.load(body);
      self.catchPageUrls($);
      self.catchImageUrls($);
    }

    if (!self.manualNext) {
      self.next();
    }
  }).setMaxListeners(0);
}

function next() {
  if (this.unfetchedUrlPool.length && (this.requestMax == 0 || this.requestCount < this.requestMax)) {
    var nextRequestUrl = this.unfetchedUrlPool.shift();
    this._request(nextRequestUrl);
  } else {
    this.finish();
  }
}

// (sync)获取所有可用的导航页面路径
function catchPageUrls($) {
  var self = this;
  var pageUrls = [];

  Array.prototype.slice.call($(this.pageSelector)).forEach(function(item, index, array) {
    var href = $(item).attr("href");

    href = self.getAbsoluteUrl(href);

    if (href && self.fetchedUrlPool.indexOf(href) < 0 && self.unfetchedUrlPool.indexOf(href) < 0) {
      self.unfetchedUrlPool.push(href);
      pageUrls.push(href);
    }
  });

  this.pageUrls(pageUrls);
}

// (sync)获取单个文档所有图片路径
function catchImageUrls($) {
  var self = this;
  var imageUrls = [];

  Array.prototype.slice.call($(this.imageSelector)).forEach(function(item, index, array) {
    var src = $(item).attr('src');
    src = self.getAbsoluteUrl(src);

    if (src && self.imageUrlPool.indexOf(src) < 0) {
      self.imageUrlPool.push(src);
      imageUrls.push(src);
    }
  });

  this.imageUrls(imageUrls);
}

// (sync)获取绝对路径
function getAbsoluteUrl(url) {
  var self = this;
  var i, len;

  // whitelist check
  for (i = 0, len = this.hostWhiteList.length; i < len; i++) {
      var whitehost = this.hostWhiteList[i];

      if (url && $util.isString(url) && url.indexOf(whitehost) >= 0) {
          break;
      }

      if (i === len - 1) {
          return null;
      }
  }

  // balcklist check
  for (i = 0, len = this.hostBlackList.length; i < len; i++) {
      var blackhost = this.hostBlackList[i];

      if (url && $util.isString(url) && url.indexOf(blackhost) >= 0) {
          return null;
      }
  }

  var handlers = [{
    regexp: /^http/,
    params: [url],
    do: function(url) {
      return url;
    },
  }, {
    regexp: /^javascript/,
    params: [url],
    do: function(url) {
      return null;
    },
  }, {
    regexp: /^\/\//,
    params: [url, self.baseUrl],
    do: function(url, baseUrl) {
      return $url.parse(baseUrl).protocol + url;
    },
  }, {
    regexp: /^(\w+.*|\/\w+.*)/,
    params: [url, self.baseUrl],
    do: function(url, baseUrl) {
      return $url.resolve(baseUrl, url);
    }
  }];

  for (var i = 0, len = handlers.length; i < len; i++) {
    var handler = handlers[i];
    if ($util.isRegExp(handler.regexp) && url && handler.regexp.test(url)) {
      return handler.do.apply(null, handler.params);
    }
  }

  return null;
}
