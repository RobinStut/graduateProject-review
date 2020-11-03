const fs = require('fs');
const gulp = require('gulp')
const data = require('gulp-data');
const nunjucksRender = require('gulp-nunjucks-render');
const minify = require('gulp-htmlmin');
const rename = require("gulp-rename");
const combine = require('merge-stream'); // Note dependency

const directories = fs.readdirSync('app/pages')

const tasks = directories.map((directory) => {
  return gulp.src(`app/pages/${directory}/*.+(html|njk)`)
    .pipe(nunjucksRender({
      path: ['app/templates']
    }))
    .pipe(minify({ collapseWhitespace: true }))
    // output files in app folder
    .pipe(rename('index.html'))
    .pipe(gulp.dest(`dist/${directory}`))
});

combine(tasks);
