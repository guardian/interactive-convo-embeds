var fs = require('fs')
var ini = require('ini')
var path = require('path')

function getAWSCredentials(grunt, cfg) {
    var awsCredentialsFilePath = cfg.credentialsFile.replace('$HOME', process.env['HOME']);
    if (!fs.existsSync(awsCredentialsFilePath)) {
        grunt.log.warn('Credentials file missing: ' + awsCredentialsFilePath);
        return
    }
    var iniFile = ini.parse(fs.readFileSync(awsCredentialsFilePath, 'utf-8'));
    if (iniFile[cfg.profile]) {
        grunt.log.ok('Using AWS credentials ' + cfg.profile + ' profile');
        return iniFile[cfg.profile];
    }

    grunt.log.warn('AWS Credentials profile ' + cfg.profile + ' does not exist. Using default credentials.')
    return iniFile.default;
}

module.exports = function(grunt) {

    require('jit-grunt')(grunt);

    var s3 = require('./s3cfg.json');
    var awsCredentials = getAWSCredentials(grunt, s3);

    grunt.initConfig({

        watch: {
            css: {
                files: ['src/css/**/*'],
                tasks: ['sass'],
            }
        },

        clean: {
            build: ['build']
        },

        sass: {
            options: {
                sourceMap: true
            },
            interactive: {
                files: {
                    'build/main.css': 'src/css/main.scss'
                }
            }
        },

        shell: {
            options: {
                execOptions: { cwd: '.' }
            },
            main: {
                command: './node_modules/.bin/jspm bundle -m src/js/main build/main.js'
            }
        },

        aws: grunt.file.readJSON('./aws-keys.json'),

        aws_s3: {
            options: {
                accessKeyId: '<%= aws.AWSAccessKeyId %>',
                secretAccessKey: '<%= aws.AWSSecretKey %>',
                region: 'us-east-1',
                uploadConcurrency: 10, // 5 simultaneous uploads
                downloadConcurrency: 10, // 5 simultaneous downloads
                debug: grunt.option('dry'),
                bucket: 'gdn-cdn',
                differential: true
            },
            production: {
                files: [
                    {
                        expand: true,
                        cwd: '.',
                        src: [
                            // shared
                            'jspm_packages/system.js', 'src/js/config.js',
                            // state
                            'build/main.css', 'build/main.js', 'build/main.js.map', 'that.html', 'between.html'
                        ],
                        dest: s3.path,
                        params: { CacheControl: 'max-age=60' }
                    }
                ]
            }
        },

        connect: {
            server: {
                options: {
                    hostname: '0.0.0.0',
                    port: 8000,
                    base: '.',
                    middleware: function (connect, options, middlewares) {
                        // inject a custom middleware http://stackoverflow.com/a/24508523
                        middlewares.unshift(function (req, res, next) {
                            res.setHeader('Access-Control-Allow-Origin', '*');
                            res.setHeader('Access-Control-Allow-Methods', '*');
                            if (req.originalUrl.indexOf('/jspm_packages/') === 0 ||
                                req.originalUrl.indexOf('/bower_components/') === 0) {
                                res.setHeader('Cache-Control', 'public, max-age=315360000');
                            }
                            return next();
                        });
                        return middlewares;
                    }
                }
            }
        }
    });

    grunt.registerTask('build', ['clean', 'sass'])
    grunt.registerTask('deploy', ['build', 'shell', 'aws_s3:production']);
    grunt.registerTask('default', ['build', 'connect', 'watch']);
}
