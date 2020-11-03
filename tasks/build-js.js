const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify')
const concat = require('gulp-concat');
const order = require("gulp-order");

// Gets .html and .nunjucks files in pages
return gulp.src('app/**/*.js')
  // Renders template with nunjucks
  .pipe(babel({
    presets: ['@babel/env'],
    plugins: ['@babel/transform-runtime']
  }))
  .pipe(uglify())
  .pipe(order([
    "app/**/firebase.js",
    "app/**/*.js"
  ]))
  .pipe(concat('script.js'))
  // output files in app folder
  .pipe(gulp.dest('dist'))
