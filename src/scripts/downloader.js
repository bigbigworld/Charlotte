var $request = require("request");
var $util = require("util");
var $customUtil = require("./custom-util")();
var $EventEmitter = require("events");
var $path = require("path");
var $crypto = require("crypto");
var $fs = require("fs");
var $mkdirp = require("mkdirp");
var $config = require("../../package.json").appConifg.downloader;
var $colors = require("colors");

function Downloader(params) {
  var obj = {
    downloadUrlPool: [],
    saveDir: null,
    getDownloadName: getDownloadName,
    localDownloadFiles: [],
  };

  $customUtil.merge(this, obj, $config, params);

  if (this.saveDir) {
    $mkdirp(this.saveDir, function(err) {
      if (err) {
        console.log(String(err).red);
      }
    });

    this.localDownloadFiles = $fs.readdirSync(this.saveDir) || [];
  }
}


$util.inherits(Downloader, $EventEmitter);

$customUtil.merge(Downloader.prototype, {
  download: download,
  _download: _download,
  saveDownloadUrls: saveDownloadUrls,
  getDownloadName: getDownloadName,
  next: next,
  checkDownloadFileExists: checkDownloadFileExists,
});

// exports
module.exports = Downloader;

function download(urls) {
  this.saveDownloadUrls(urls);
  this.next();
}

function saveDownloadUrls(urls) {
  if ($util.isArray(urls)) {
    for (var i = 0, len = urls.length; i < len; i++) {
      var url = urls[i];
      if (this.downloadUrlPool.indexOf(url) < 0) {
        this.downloadUrlPool.push(urls[i]);
      }
    }
  } else if ($util.isString(urls)) {
    this.saveDownloadUrls(Array.prototype.slice.call(null, 1))
  } else if ($util.isFunction(urls)) {
    this.saveDownloadUrls(urls());
  }

  return null;
}

function next() {
  if (this.downloadUrlPool.length) {
    this._download(this.downloadUrlPool.shift());
  }
}

function _download(url) {
  var self = this;

  console.log($colors.cyan("~ %s"), url);

  var downloadName = getDownloadName(url, ".jpg");
  var path = $path.resolve(this.saveDir, downloadName);

  if (this.checkDownloadFileExists(downloadName)) {
    console.log($colors.grey("local exists.(%s)"), path);
    this.next();
  } else {
    $request.head(url, function(err, res, body) {
      if (err) {
        console.log(err);
      }

      $request(url).on("error", function(err) {
        console.log(err);
      })
        .on("end", function() {
          console.log($colors.green("download completed.(%s)"), path);
          self.next();
        })
        .pipe($fs.createWriteStream(path));

    });
  }
}

function getDownloadName(src, extension) {
  return $crypto.createHash("md5").update(src).digest("hex") + (extension || "");
}

function checkDownloadFileExists(filename) {
  return this.localDownloadFiles.indexOf(filename) > -1;
}
