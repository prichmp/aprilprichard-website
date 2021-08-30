
const gulp = require('gulp');
const less = require('gulp-less');

function lessCompile(cb) {
    gulp.src('./_less/**/*.less')
    .pipe(less())
    .pipe(gulp.dest('./css'));
    cb();
  }
  
exports.lessCompile = lessCompile;

function lessWatch(cb)
{
    gulp.series(lessCompile);
    gulp.watch(
        './_less/**/*.less',
        lessCompile
    );
}

exports.lessWatch = lessWatch;