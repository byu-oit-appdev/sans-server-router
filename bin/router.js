/**
 *  @license
 *    Copyright 2016 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 **/
'use strict';

const map = new WeakMap();

module.exports = Router;

function Router(configuration) {
    const router = Object.create(Router.prototype);
    const routes = {
        copy: [],
        delete: [],
        get: [],
        head: [],
        link: [],
        options: [],
        patch: [],
        post: [],
        purge: [],
        put: [],
        unlink: []
    };
    return router;
}

Router.prototype.all = function(path, middleware) {

};

Router.prototype.copy = function(path, middleware) {

};

Router.prototype.delete = function(path, middleware) {

};

Router.prototype.get = function(path, middleware) {
    const routes = map.get(this);
};

Router.prototype.head = function(path, middleware) {

};

Router.prototype.link = function(path, middleware) {

};

Router.prototype.options = function(path, middleware) {

};

Router.prototype.patch = function(path, middleware) {

};

Router.prototype.post = function(path, middleware) {

};

Router.prototype.purge = function(path, middleware) {

};

Router.prototype.put = function(path, middleware) {

};

Router.prototype.unlink = function(path, middleware) {

};