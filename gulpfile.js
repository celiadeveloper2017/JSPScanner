
var gulp = require('gulp'),
    concat = require('gulp-concat'),
  
    fs = require('fs'),
    q = require('q'),
    del = require('del'),
    gutil = require('gulp-util'),
  
    rename = require('gulp-rename'),
    dom=require('gulp-dom'),
    replace=require('gulp-replace-assets'),
    scan_path = './webroot/',
    update_path='./webroot/translation/',
    keyscanner=require('./webroot/../Scanner.js'),
    ks=new keyscanner();

gulp.task('clean:props', function(){
    return del([update_path+'**/*.txt',update_path+'**/*.properties'], {force:true});
});
gulp.task('clean:jsp', function(){
    return del([update_path+'**/*.jsp'], {force:true});
});
gulp.task('clean:translation', function(){
    return del([update_path+'**'], {force:true});
})
gulp.task('keyscan', gulp.series('clean:translation',function(){
    var deferred = q.defer();

    ks.getFiles(scan_path, 'jsp', 'Y', 'N', function(err, data){
        if(err)return;
        if (data) {
            data.forEach(function(item)
                {
                    
                }
            )
        }
        deferred.resolve();
    })

    return deferred.promise;
}));


gulp.task('combineFiles', function(){

    return gulp.src(update_path+'**/*.txt').pipe(concat('all.txt')).pipe(gulp.dest(update_path+'afterProcess/'));
});
gulp.task("clean:update", function(){
    return del([update_path+'afterProcess/*.properties'],{force:true});
})

gulp.task('postkeyscan', gulp.series('clean:update','combineFiles', function(){
    var deferred= q.defer();
    var outputStram='';
    var temp=[];
    var data=fs.readFileSync(update_path+'afterProcess/all.txt').toString();
    if(data.length){
        var pairs= data.split('|');
        for(var i=0; i<pairs.length;i++){
            if(pairs[i].trim().replace(/\s/g,'')){
                var str= pairs[i].trim();
                if(temp.indexOf(str)<0){
                    temp.push(str);
                    outputStram+=str;
                    outputStram+='\r\n';
                }
            }
        }
    }
    fs.appendFile(update_path+'afterProcess/all.properties',outputStram, function(err){
        if(err)throw err;
        console.log(outputStram);
        deferred.resolve();
    });
    return deferred.promise;
    
}));
gulp.task('clean:backup', function(){
    return del(['backup/**'], {force:true});
})
gulp.task('backup_original', function(){
    return gulp.src([scan_path+'**/*.jsp', scan_path+'**/*.js','!'+scan_path+'translation/**'], {base:scan_path}).pipe(gulp.dest('backup/original/'));
});

gulp.task('backup_translation', function(){
    return gulp.src([update_path+'**/*.jsp',update_path+'**/*.js', update_path+'**/*.txt', update_path+'**/*.properties'], {base:update_path}).pipe(gulp.dest('backup/translation/'));
});
gulp.task('backup', gulp.series('clean:backup', 'backup_original', 'backup_translation', function(){
    return del([scan_path+'translation/**'], {force:true});
}));
gulp.task('clean:beforeCompile', function(){

    return del([scan_path+'**/*.jsp'], {force:true});
})

gulp.task('updateJSPandJS', gulp.series('backup',function(){
    var deferred=q.defer();
    ks.getFiles('backup/translation/', 'js', 'N', 'Y',function(err, data){
        if(err){
            console.log(err);
            return;
        }
        if(data && data.length){
            data.forEach(function(elem){
                if(elem){
                    var temp= elem.split('/');
                    var path='';
                    for(var i=2; i<temp.length-1;i++){
                        path+=temp[i]+'/';
                    }
                    path=scan_path+path;
                    gulp.src(elem).pipe(gulp.dest(path));
                }
            })
        }
        deferred.resolve();
    })
   gulp.src(['backup/translation/**/*.jsp'], {base:'backup/translation/'}).pipe(gulp.dest(scan_path));
    return deferred.promise;
}))
gulp.task('revert', gulp.series('clean:beforeCompile', function(){
    return gulp.src('backup/original/**/*.jsp', 'backup/original/**/*.js',{base:'backup/original/'}).pipe(gulp.dest(scan_path));
}));

gulp.task("replaceSnippets",function () {
    ks.getFiles(scan_path, 'jsp', N, Y, function(err, data){
        if(data && data.length){
            data.forEach(function(item){
                if(!ks.skipArr.includes(item)){
                    ks.replaceSnippet(item)
                }
            })
        }
    })
});