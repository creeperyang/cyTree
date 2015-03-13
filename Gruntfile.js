// Generated on 2014-12-11 using generator-angular 0.10.0
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

// Configurable paths for the application
var appConfig = {
    app: 'src',
    dist: 'dist',
    demo: 'demo'
};

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({
        config: appConfig,
        copy: {
            dist: {
                expand: true, // 当使用cwd时需要expand，动态src的映射
                cwd: '<%= config.app %>/', // 相对于src，需要/
                src: '*.js',
                dest: '<%= config.dist %>/', // 需要/
                ext: '.js', //是否修改目标文件的后缀名
            }
        },
        clean: {
            dist: {
                src: '<%= config.dist %>/**/*',
                dot: true,
                expand: true
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                force: true, // wont stop if hint failed
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
                    'Gruntfile.js',
                    '<%= config.app %>/{,*/}*.js'
                ]
            }
        },
        uglify: {
            dist: {
                expand: true,
                cwd: '<%= config.dist %>/',
                src: '**/*.js',
                dest: '<%= config.dist %>/',
                ext: '.min.js'
            }
        },
        // Automatically inject Bower components into the app
        wiredep: {
            demo: {
                devDependencies: true,
                src: ['<%= config.demo %>/index.html'],
                ignorePath: /\.\.\//
            }
        },
        watch: {
            bower: {
                files: ['bower.json'],
                tasks: ['wiredep']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            less: {
                files: ['<%= config.app %>/*.less'],
                tasks: ['less:dist']
            },
            js: {
                files: ['<%= config.app %>/*.js'],
                tasks: ['copy:dist']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [ // 监听到文件变化不执行任何task，直接reload
                    '<%= config.demo %>/{,*/}*.{js,css,html}',
                    '<%= config.dist %>/{,*/}*.{js,css}'
                ]
            }
        },
        // The actual grunt server settings
        connect: {
            options: {
                port: 9080,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true, // 自动打开浏览器
                    middleware: function(connect) {
                        return [
                            connect().use(
                                '/bower_components',
                                connect.static('./bower_components')
                            ),
                            connect.static(appConfig.demo),
                            connect.static(appConfig.dist)
                        ];
                    }
                }
            },
            dist: {
                options: {
                    open: true,
                    base: '<%= config.demo %>'
                }
            }
        },

        // compile less to css
        less : {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= config.app %>/',
                    src: '*.less',
                    dest: '<%= config.dist %>/',
                    ext: '.css'
                }]
            }
        }
    });


    grunt.registerTask('build', [
        'clean',
        'jshint',
        'copy:dist',
        'less:dist',
        'uglify:dist'
    ]);

    grunt.registerTask('serve', 'Compile then start a connect web server', function(target) {
        if (grunt.option('allow-remote')) {
            grunt.config.set('connect.options.hostname', '0.0.0.0');
        }

        grunt.task.run([
            'build',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('demo', [
        'build',
        'watch'
    ]);
};
