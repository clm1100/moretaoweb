module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    eslint: {
      target: ['assets/javascripts/*.js', 'app.js', 'routes/*.js', 'models/*.js']
    },

    bowercopy: {
      options: { srcPrefix: 'components' },
      // Javascript
      libs: {
        options: { destPrefix: 'assets/javascripts/libs' },
        files: {
          'jquery.js': 'jquery/dist/jquery.min.js',
          'what-input.js': 'what-input/what-input.min.js',
          'foundation.js': 'foundation-sites/dist/foundation.min.js',
          'doT.js': 'doT/doT.min.js',
          'jquery.cookie.js': 'jquery.cookie/jquery.cookie.js',
          'jquery.waypoints.js': 'waypoints/lib/jquery.waypoints.min.js',
          'jquery.pep.js': 'jquery.pep/src/jquery.pep.js',
          'clamp.js': 'clamp.js/clamp.min.js',
          'moment.js': 'moment/min/moment-with-locales.min.js',
          'retina.js': 'retina.js/dist/retina.min.js',
          'slick.js': 'slick.js/slick/slick.min.js',
          'hammer.js': 'hammerjs/hammer.min.js',
          'jquery.hammer.js': 'jquery.hammer.js/jquery.hammer.js',
          'url.js': 'js-url/url.min.js',
          'image-preview.js': 'image-preview/image-preview.min.js',
          'spark-md5.js': 'spark-md5/spark-md5.min.js',
          'async.js': 'async/dist/async.min.js',
          'imagesloaded.js': 'imagesloaded/imagesloaded.pkgd.min.js',
          'masonry.js': 'masonry/dist/masonry.pkgd.min.js',
          'jquery.lazyload.js': 'jquery.lazyload/jquery.lazyload.js',
          'social-network-text.js': 'social-network-text/social-network-text.min.js',
          'html2canvas.js': 'html2canvas/dist/html2canvas.min.js',
          'stackblur.js': 'stackblur-canvas/dist/stackblur.min.js',
          'autosize.js': 'autosize/dist/autosize.min.js'
        }
      },
      fonts: {
        files: {
          'assets/fonts': ['fontawesome/fonts/fontawesome*', 'slick.js/slick/fonts/*']
        }
      },
      // css
      css: {
        options: { destPrefix: 'assets/stylesheets' },
        files: {
          'foundation.css': 'foundation-sites/dist/foundation.min.css',
          'font-awesome.css': 'fontawesome/css/font-awesome.min.css',
          'slick.css': 'slick.js/slick/slick.css',
          'animate.css': 'animate.css/animate.min.css'
        }
      }
    },

    'string-replace': {
      js: {
        files: { 'assets/javascripts/libs/': [
          'assets/javascripts/libs/async.js',
          'assets/javascripts/libs/hammer.js',
          'assets/javascripts/libs/jquery.js'
        ] },
        options: {
          replacements: [
            { pattern: '//# sourceMappingURL=dist/async.min.map', replacement: '' },
            { pattern: '//# sourceMappingURL=hammer.min.map', replacement: '' },
            { pattern: '//# sourceMappingURL=jquery.min.map', replacement: '' }
          ]
        }
      }
    },

    webfont: {
      icons: {
        src: 'assets/icons/*.svg',
        dest: 'assets/fonts',
        destCss: 'assets/stylesheets',
        options: {
          font: 'icons',
          types: 'eot,woff,woff2,ttf,svg',
          order: 'eot,woff2,woff,ttf,svg',
          normalize: true,
          htmlDemo: false,
          templateOptions: {
            baseClass: 'mt',
            classPrefix: 'mt-',
            mixinPrefix: 'mt-'
          }
        }
      }
    },

    uglify: {
      app: {
        files: [{
          expand: true,
          cwd: 'assets/javascripts',
          src: '*.js',
          dest: 'public/javascripts'
        }]
      },
      build:{
        files:{
          'public/javascripts/libs/libraries.js': [
            'assets/javascripts/libs/jquery.js',
            'assets/javascripts/libs/what-input.js',
            'assets/javascripts/libs/foundation.js',
            'assets/javascripts/libs/doT.js',
            'assets/javascripts/libs/moment.js',
            'assets/javascripts/libs/jquery.cookie.js',
            'assets/javascripts/libs/jquery.waypoints.js',
            'assets/javascripts/libs/jquery.pep.js',
            'assets/javascripts/libs/clamp.js',
            'assets/javascripts/libs/url.js',
            'assets/javascripts/libs/slick.js',
            'assets/javascripts/libs/hammer.js',
            'assets/javascripts/libs/jquery.hammer.js',
            'assets/javascripts/libs/image-preview.js',
            'assets/javascripts/libs/spark-md5.js',
            'assets/javascripts/libs/async.js',
            'assets/javascripts/libs/imagesloaded.js',
            'assets/javascripts/libs/masonry.js',
            'assets/javascripts/libs/jquery.lazyload.js',
            'assets/javascripts/libs/social-network-text.js',
            'assets/javascripts/libs/html2canvas.js',
            'assets/javascripts/libs/stackblur.js',
            'assets/javascripts/libs/autosize.js',
            'assets/javascripts/libs/retina.js'
          ]
        }
      }
    },

    csscomb:{ app:{ files:{ 'assets/stylesheets/application.css':['assets/stylesheets/application.css'] } } },

    postcss:{
      options:{
        map:false,
        processors:[require('autoprefixer')({ browsers: ['last 3 versions'] })]
      },
      dist:{ src:'assets/stylesheets/application.css' }
    },

    cssmin: {
      build: {
        files: {
          'public/stylesheets/application.css': [
            'assets/stylesheets/foundation.css',
            'assets/stylesheets/font-awesome.css',
            'assets/stylesheets/slick.css',
            'assets/stylesheets/animate.css',
            'assets/stylesheets/icons.css',
            'assets/stylesheets/slick-custom.css',
            'assets/stylesheets/application.css'
          ]
        }
      }
    },

    clean: { src: [
      'public/images/**',
      'public/fonts/**',
      'public/javascripts/*.js',
      'public/javascripts/*.map',
      'public/javascripts/libs/*.js',
      'public/stylesheets/*.css',
      'public/stylesheets/libs/*.css'
    ] },

    copy: {
      js: {
        cwd: 'assets/javascripts/libs',
        src: ['*.map'],
        dest: 'public/javascripts/libs',
        expand: true
      },
      fonts: {
        cwd: 'assets/fonts',
        src: ['*.otf', '*.eot', '*.svg', '*.ttf', '*.woff', '*.woff2'],
        dest: 'public/fonts',
        expand: true
      },
      img: {
        cwd: 'assets/images',
        src: ['**'],
        dest: 'public/images',
        expand: true
      }
    }
  });

  // 加载标准 copy/clean/replace 插件
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-string-replace');

  // 载入 eslint 插件，用于 JS 代码检查
  grunt.loadNpmTasks('grunt-eslint');

  // 加载 bowercopy 任务的插件, 用于 copy bower 的文件到 css js 目录
  grunt.loadNpmTasks('grunt-bowercopy');

  // 载入 webfont 插件，用于生成图标字体文件
  grunt.loadNpmTasks('grunt-webfont');

  // 载入 uglify 插件，用于 JS 压缩
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // 载入 cssmin 插件用于 css 压缩
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // 载入 csscomb 插件用于 css 自动排序
  grunt.loadNpmTasks('grunt-csscomb');

  // 载入 postcss 插件用于 css 自动补全
  grunt.loadNpmTasks('grunt-postcss');

  // 默认被执行的任务列表。
  grunt.registerTask('default', ['eslint', 'bowercopy', 'string-replace', 'clean', 'copy', 'uglify', 'csscomb', 'postcss', 'cssmin']);
};
