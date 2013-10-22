var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var tap = require('tap');
var wd = require('wd');
var utils = require('./lib/utils');

var request = require('request');
var async = require('async');

var URL = 'http://localhost:5000';
var LIVE_URL = 'http://passive-agressive-1248.herokuapp.com/';

var _events_url_template = _.template('<%= root %>/rest/event?category=movie&zip=<%= zip %>');
var _event_url_template = _.template('<%= root %>/rest/event/<%= encodeURIComponent(id) %>?category=movie&zip=<%= zip %>');

var SF_ZIP = 94103;

var moment = require('moment');


function _events_url(zip) {
    return _events_url_template({ root: LIVE_URL, zip: zip});
}

function _event_url(zip, id) {
    return _event_url_template({ root: LIVE_URL, zip: zip, id: id});
}

tap.test('events', {timeout: 1000 * 100, skip: false }, function (suite) {

    suite.test('mock data test', {timeout: 1000 * 10, skip: true }, function (e_test) {
        var browser = wd.remote();

        function _abort(err) {
            browser.quit(function () {
                if (err) {
                    console.log('error: ', err);
                    e_test.error(err);
                }
                e_test.end();
            });
        }

        browser.init({
            browserName: 'chrome', tags: ["examples"], name: "navigation"
        }, function () {
            browser.get(URL + "/events/view/movie/10001?mock=handmade_data", function () {
                setTimeout(function () {
                    browser.title(function (err, title) {
                        console.log('result of title: %s, %s', err, title);
                        e_test.equal(title, 'PA: movie: 10001', 'title is equal');

                        return utils.getAttribute(browser, '.event-toggle-open', 'data-id')
                            .then(function (value) {
                                e_test.equal(value, 'mockid10001', 'has mock id');

                            }, _abort)
                            .then(function () {
                                browser.quit(function () {
                                    e_test.end();
                                });
                            }, _abort)
                    });
                }, 3000); // give Angular some time to format template
            });
        });
    });

    /**
     * testing live site. Checking times of first movie in listing.
     * note we are running this test in SF, so no time zone slippage -- need a second set of tests for NYC
     */

    suite.test('testing real listings against REST data', {timeout: 1000 * 50, skip: false}, function (real_test) {

        var browser = wd.remote();

        function _abort(err) {
            browser.quit(function () {
                if (err) {
                    console.log('error: ', err);
                    real_test.error(err);
                }
                real_test.end();
            });
        }

        function _done() {
            browser.quit(function () {
                real_test.end();
            });
        }

        browser.init({
            browserName: 'chrome', tags: ["examples"], name: "navigation"
        }, function () {
            /**
             * getting the REST data for the movie lisitng in SF
             */
            request.get(_events_url(SF_ZIP), function (err, res, body) {
                if (_.isString(body)) {
                    body = JSON.parse(body);
                }

                real_test.ok(body.length > 0, 'have body length');
                console.log('%s movies playing today', body.length);

                var movie = body[0];
                var button_css = 'button[data-id="' + movie.id + '"]';

                browser.get(LIVE_URL + "/events/view/movie/" + SF_ZIP, function () {
                    /**
                     * validating that the first movie in the event REST is also on the page
                     *
                     */
                    utils.getText(browser, button_css, function (err, text) {
                        console.log('text of button: %s', util.inspect(text));
                        real_test.equal(text, movie.title, 'found movie');

                        /**
                         * getting the REST data for the first movie
                         */
                        request.get(_event_url(SF_ZIP, movie.id), function (err, res, movie_data) {


                            console.log('movie data: %s', util.inspect(movie_data));

                            venue_data = JSON.parse(movie_data);

                            utils.click(browser, button_css)
                                .then(function () {
                                    setTimeout(function () {
                                        console.log('getting venue content');
                                        var venue_css = 'div[data-id="event-' + venue_data.id + '-venue-' + venue_data.venue_id + '"]';
                                        console.log('venue css: %s', venue_css);
                                        utils.getText(browser, venue_css + ' h3')
                                            .then(function (venue) {
                                                real_test.equal(venue, venue_data.venue_name + ':', 'found venue name in h3');

                                                var t = venue_data.times[0].start_time;
                                                var movie_time = new moment(t);

                                                console.log('looking for movie time %s based on %s', movie_time.format(), t);

                                                var time_ele =  venue_css
                                                    + ' time[data-date="' + movie_time.format('MM.DD') + '"]';
                                                console.log('time ele: %s', time_ele);
                                                utils.getText(browser, time_ele)
                                                    .then(function (text) {
                                                        var tt = movie_time.format('hh:mm');
                                                        console.log('searching for ', tt, 'in time', text);
                                                        real_test.ok(text.search(tt) >= 0, 'can find a time in the times list');

                                                        _done();
                                                    }, _abort);

                                            }, _abort);

                                    }, 5000);
                                })

                        });
                    });
                });
            })
        });

    });


    suite.end();

});