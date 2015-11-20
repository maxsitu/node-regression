var fs = require('fs');
var path = require('path');

function isTestDirecory(dir,filename){
  file = path.resolve(dir,filename);
  fs.stat(file,function(err, stat){
    if(stat && stat.isFile()){
      return true;
    }
    else{
      return false;
    }
  });
}

function walk(dir, done) {
  var results = {};
  console.log(dir);
  fs.readdir(dir, function(err, list) {
	console.log(list);
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
		console.log(stat);
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        }
      });
    });
  });
  return results
};