var gulp = require('gulp');
var clean = require('gulp-clean');
var gutil = require('gulp-util');
var gulpIf = require('gulp-if');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var htmlmin = require('gulp-htmlmin');
var beautify = require('gulp-beautify');
var cssbeautify = require('gulp-cssbeautify');
var prettify = require('gulp-prettify');
var imagemin = require('gulp-imagemin');

 
gulp.task('beautify', function() {
  gulp.src('src/*')
    .pipe(gulpIf('*.js', beautify({indentSize: 4})))
    .pipe(gulpIf('*.css', cssbeautify()))
    .pipe(gulpIf('*.html', prettify({indent_size: 4})))
    .pipe(gulp.dest(''))
});

gulp.task('clean', function () {
	return gulp.src('dist/*', {read: false})
		.pipe(clean());
});

gulp.task('minify', function() {
	return gulp.src('src/*')
	.pipe(gulpIf('*.js', uglify().on('error', gutil.log)))
	.pipe(gulpIf('*.css', cssnano()))
	.pipe(gulpIf('*.html', htmlmin({collapseWhitespace: true})))
	.pipe(gulp.dest('dist'));
});

gulp.task('image', function() {
	return gulp.src('src/images/*')
	.pipe(imagemin())
	.pipe(gulp.dest('dist/images'))
});

gulp.task('vendors', function() {
	return gulp.src('src/vendors/*')
	.pipe(gulp.dest('dist/vendors'))
});