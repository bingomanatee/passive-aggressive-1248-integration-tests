var _ = require('underscore');
var util = require('util');
var path = require('path');
var fs = require('fs');
var tap = require('tap');

var ROOT_URL = 'http://localhost:5000';
var request = require('request');
var async = require('async');

var _events_mock_url_template = _.template('<%= root %>/rest/event?category=movie&zip=<%= zip %>&mock=<%= mock %>');
var _event_mock_url_template = _.template('<%= root %>/rest/event/<%= encodeURIComponent(id) %>?category=movie&zip=<%= zip %>&mock=<%= mock %>');
var _events_url_template = _.template('<%= root %>/rest/event?category=movie&zip=<%= zip %>');
var _event_url_template = _.template('<%= root %>/rest/event/<%= encodeURIComponent(id) %>?category=movie&zip=<%= zip %>');
var _events_url_put_template = _.template('<%= root %>/rest/event');

function _event_mock_url(mock, zip, id) {
    return _event_mock_url_template({mock: mock, root: ROOT_URL, id: id, zip: zip});
}

function _events_mock_url(mock, zip) {
    return _events_mock_url_template({mock: mock, root: ROOT_URL, zip: zip});
}

function _events_url(zip) {
    return _events_url_template({ root: ROOT_URL, zip: zip});
}

function _event_url(zip, id) {
    return _event_url_template({ root: ROOT_URL, zip: zip, id: id});
}

function _events_url_put(zip) {
    return _events_url_put_template({ root: ROOT_URL, zip: zip});
}

function _boolify(data){
    _.each(data, function(value, field){
       if (value == 'false'){
           data[field] = false;
       } else if (value == 'true'){
           data[field] = true;
       } else if (_.isArray(value)) {
           data[field] = value.map(_boolify);
       } else if (_.isObject(value)){
           data[field] = _.each(value, function(vv, ff){
               data[field][ff] = _boolify(vv);
           })
       } else if (_.isNull(value)){
           delete data[field];
       }

    });

    return data;
}

tap.test('events', {timeout: 1000 * 100, skip: false }, function (suite) {

    suite.test('events tests', {timeout: 1000 * 100, skip: false }, function (es_test) {

        var url = _events_url(10001);
        console.log('url: %s', url);

        request.get(url, {}, function (err, res, body) {
            console.log('events gotten: %s, %s, %s', err, res, body.substr(0, 50));
            request.put(_events_url_put(10001), {form: {data: JSON.parse(body), zip: 10001, mock: 'mock_data'}},
                function () {
                    var mu = _events_mock_url('mock_data', 10001);
                    console.log('mu: %s', mu);
                    request.get(mu, {}, function (err, res, body) {
                        console.log('body: %s', body.substr(0, 20));
                        if (err) throw err;
                        if (_.isString(body)) {
                            body = JSON.parse(body);
                        }

                        console.log('gotten %s events', body.length);

                        var event_data = {};

                        var query = async.queue(function (event, done) {
                            console.log('putting event %s', event.title);

                            request.get(_event_url(10001, event.id), {}, function (err, res, body) {

                                var bbody = body;
                                if (_.isString(body)) {
                                    try {
                                        body = JSON.parse(body);
                                    } catch (err) {
                                        console.log('error parsing %s: %s', bbody, err);
                                        return done();
                                    }
                                }

                                event_data[event.id] = body;

                                request.put(_events_url_put(10001), {form: {data: body, zip: 10001, id: encodeURIComponent(event.id), mock: 'mock_data'}}, function(err, res, body){

                                    if (err){
                                        console.log('error putting: %s', err);
                                    } else {
                                        done();
                                    }

                                });

                            })

                        });

                        query.drain = function () {
                            console.log('testing mock put data');
                            var v = _.values(event_data).slice(0, 50);
                            console.log('pushing %s events', v.length);

                            var get_mock_queue = async.queue(function(event, done){

                                request.get(_event_mock_url('mock_data', 10001, event.id), {}, function(err, res, body){
                                    if (err){
                                        return done(err);
                                    }
                                   if (_.isString(body)){
                                       var bbody = body;
                                     try {
                                         body = JSON.parse(body);
                                     } catch(err){
                                         console.log('error parsing %s', bbody);
                                         return done();
                                     }
                                   }
                                    console.log('testing %s', event.id);

                                    es_test.deepEqual(_boolify(body), _boolify(event_data[event.id], 'retrieved event ' + event.id));
                                    done();
                                });

                            });

                            get_mock_queue.drain = function(){
                                es_test.end();
                            };

                            get_mock_queue.push(v);
                        };

                        query.push(body.slice(0, 50));
                    });

                })
        })

    });


    suite.test('event tests', {timeout: 1000 * 10, skip: false }, function (e_test) {

        e_test.end();
    });

    suite.end();

});