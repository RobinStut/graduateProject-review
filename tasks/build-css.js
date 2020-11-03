const gulp = require('gulp');
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');

  // Gets .html and .nunjucks files in pages
  return gulp.src('app/**/*.css')
    // Renders template with nunjucks
    .pipe(concat('style.css'))
    .pipe(cleanCSS())
    .pipe(autoprefixer({
      cascade: false
    }))
    // output files in app folder
    .pipe(gulp.dest('dist'))
