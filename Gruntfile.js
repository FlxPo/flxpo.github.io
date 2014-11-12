module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    // Concatenate all js files
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['js/app/**/*.js'],
        dest: 'build/app-metab.js'
      }
    }

    ,

    // Uglify the concatened files
    uglify: {
      my_target: {
        files: {
          'build/app-metab.min.js': ['build/app-metab.js']
        }
      }
    }

    ,

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['style/*.css'],
        dest: 'build/style.css'
      }
    }

    ,

    cssmin: {
      my_target: {
        files: [{
          expand: true,
          cwd: 'style/',
          src: ['*.css'],
          dest: 'build/',
          ext: '.min.css'
        }]
      }
    }


  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify', 'cssmin']);

};