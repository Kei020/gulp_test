const gulp = require('gulp');
// sassの読み込み
const gulpDartSass = require('gulp-dart-sass'); //dart-sassを扱う プラグイン
const autoprefixer = require('gulp-autoprefixer');  // ベンダープレフィックス
const sassGlob = require('gulp-sass-glob-use-forward');
const plumber = require('gulp-plumber'); // watch時にエラーが出ても止まらないようにするためのプラグイン。
const gcmq = require('gulp-group-css-media-queries'); // バラバラに書かれたメディアクエリをまとめてくれるプラグイン。
const sourcemaps = require('gulp-sourcemaps'); // ソースマップを作ってくれるプラグイン。
const imageMin = require('gulp-imagemin'); //画像圧縮に必要なプラグイン
const mozjpeg = require('imagemin-mozjpeg');
const pngquant = require('imagemin-pngquant');
const changed = require('gulp-changed');
const browserSync = require('browser-sync').create()


//htmlコピー
function htmlCopy() {
    return gulp.src('src/*.html')
        .pipe(gulp.dest('dest'));
}

//dart-sass コンパイル
function cssTranspile() {
    return gulp.src('src/sass/**/*.scss')
        // 強制停止を防止
        .pipe(plumber({
            errorHandler: function (err) {
                console.log(err.messageFormatted);
                this.emit('end');
            }
        }))
        .pipe(sourcemaps.init())
        // glob
        .pipe(sassGlob())
        .pipe(gulpDartSass({
            outputStyle: 'expanded'
        }))
        // ベンダープレフィックスを付ける
        .pipe(autoprefixer({ cascade: false, }))
        // メディアクエリをまとめる
        .pipe(gcmq())
        // ソースマップを出力する
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dest/css'));

}

//画像圧縮
function imagemin() {
    return gulp.src("src/images/**")
        .pipe(changed("dest/images/"))   // 追加
        .pipe(
            imageMin([
                pngquant({
                    quality: [0.6, 0.7],
                    speed: 1,
                }),
                mozjpeg({ quality: 72 }),
                imageMin.svgo(),
                imageMin.optipng(),
                imageMin.gifsicle({ optimizationLevel: 3 }),
            ])
        )
        .pipe(gulp.dest("dest/images/"));

}


//ブラウザを初期化
function browserSyncInit() {
    browserSync.init({
        server: {
            baseDir: 'dest',
        }
    })
}


function browserSyncReload(callback) {
    browserSync.reload();
    callback();
}


function watchFiles() {
    gulp.watch('src/**/*.html', gulp.series(htmlCopy, browserSyncReload));
    gulp.watch('src/sass/**/*.scsss', gulp.series(cssTranspile, browserSyncReload));
    gulp.watch('src/images/**', gulp.series(imagemin, browserSyncReload));
}

exports.cssTranspile = cssTranspile;
exports.imagemin = imagemin;
exports.default = gulp.series(htmlCopy, cssTranspile, imagemin, gulp.parallel(browserSyncInit, watchFiles));