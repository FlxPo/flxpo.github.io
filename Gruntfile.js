module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    // Concatenate all css/js files
    concat: {
      cssfiles : {
        src: 'style/*.css',
        dest: 'build/app-metab-syle.css'
      },
      jsfiles : {
        src: 'js/app/**/*.js',
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
      },
      options: {
        preserveComments:false
      }
    }

    ,

    cssmin: {
      my_target: {
        files: {'build/app-metab-syle.css': ['build/app-metab-syle.min.css']}
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