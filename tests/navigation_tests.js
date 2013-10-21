var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var tap = require('tap');
var wd = require('wd');
var utils = require('./lib/utils');

var URL = 'http://passive-agressive-1248.herokuapp.com/';

tap.test('navigation', {timeout: 1000 * 200, skip: false }, function (suite) {

    suite.test('home page', {timeout: 1000 * 100, skip: false }, function (hp_test) {
        var browser = wd.remote();

        function _abort(err) {
            browser.quit(function () {
                if (err) {
                    console.log('error: ', err);
                    hp_test.error(err);
                }
                hp_test.end();
            });
        }

        browser.init({
            browserName: 'chrome', tags: ["examples"], name: "navigation"
        }, function () {
            browser.get(URL, function () {
                setTimeout(function () {
                    browser.title(function (err, title) {
                        console.log('result of title: %s, %s', err, title);
                        hp_test.equal(title, 'Passive Aggressive 1248', 'title is equal');

                        utils.visible(browser, 'button.all-locations')
                            .then(function (visible) {
                                hp_test.ok(!visible, 'all locations button is not yet visible')
                            }, _abort)
                            .then(function () {
                                return utils.visible(browser, 'button.portlandor')
                            })
                            .then(function (visible) {
                                hp_test.ok(visible, 'Portland button is visible');
                            }, _abort)
                            .then(function () {
                                return utils.visible(browser, 'button.nyc')
                            })
                            .then(function (visible2) {
                                hp_test.ok(visible2, 'New York button is visible');
                            }, _abort)
                            .then(function () {
                                return  utils.click(browser, 'button.portlandor')
                            })
                            .then(function () {
                                return  utils.visible(browser, 'button.nyc');
                            }, _abort)
                            .then(function (visible3) {
                                hp_test.ok(!visible3, 'NY button no longoer visible');
                            }, _abort)
                            .then(function () {
                                return  utils.visible(browser, 'button.all-locations')
                            })
                            .then(function (visible) {
                                hp_test.ok(visible, 'all locations button is now visible')
                            }, _abort)
                            .then(function () {
                                return  utils.click(browser, 'button.all-locations')
                            })
                            .then(function (visible4) {
                                hp_test.ok(!visible4, 'New York button is not visible finally');
                            }, _abort)
                            .then(function () {
                                browser.quit(function () {
                                    hp_test.end();
                                });
                            })
                    });
                }, 3000); // give Angular some time to format template
            });
        });
    });

    suite.test('get movies', {timeout: 1000 * 100, skip: false }, function (movie_test) {

        var browser = wd.remote();

        function _abort(err) {
            browser.quit(function () {
                if (err) {
                    movie_test.error(err);
                }
                movie_test.end();
            });
        }

        browser.init({
            browserName: 'chrome', tags: ["examples"], name: "navigation"
        }, function () {
            browser.get(URL, function () {
                setTimeout(function () {
                    utils.visible(browser, 'button.all-locations')
                        .then(function (visible) {
                            movie_test.ok(!visible, 'all locations button is not yet visible')
                        }, _abort)
                        .then(function () {
                            return utils.visible(browser, 'button.portlandor')
                        })
                        .then(function (visible) {
                            movie_test.ok(visible, 'Portland button is visible');
                        }, _abort)
                        .then(function () {
                            return  utils.click(browser, 'button.portlandor')
                        })
                        .then(function () {
                            return  utils.click(browser, 'button.event-movie')
                        })
                        .then(function () {
                            setTimeout(function () {
                                var css = '#paEventsCtrl h1';
                                utils.getText(browser, css)
                                    .then(function (text) {
                                        movie_test.equal(text, 'Movies in zip Portland, OR', 'found event view title');
                                        _abort();
                                    }, _abort);

                            }, 4000);
                        });
                }, 3000);
            });
        });
    });

    suite.end();

});