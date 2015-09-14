var gulp       = require('gulp');
var babel      = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var changed    = require('gulp-changed');


const SRC_DIR  = 'src/**/*.es6';

gulp.task('src', function() {
    return gulp.src([SRC_DIR])
        .pipe(changed('lib/**/*.js'))
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('lib/'));
});

gulp.task('default', ['src']);
