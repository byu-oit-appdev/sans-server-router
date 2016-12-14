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
const Router                = require('./router');

module.exports = function(configuration) {
    const sansServer = this;
    const methods = sansServer.supportedMethods().map(function(v) { return v.toLowerCase(); });
    const instance = Router(configuration);

    // add functions to the sans-server instance
    sansServer.all = instance.all;
    Router.methods.forEach(function(method) {
        if (methods.indexOf(method) === -1) {
            sansServer[method] = function() {
                const err = Error('Method not supported by sans-server instance:' + method);
                err.code = 'ESSRMET';
                throw err;
            };
        } else {
            sansServer[method] = instance[method];
        }
    });

    // return middleware function
    return function router(req, res, next) {
        const handler = instance.handler(req.method, req.path);
        handler(req, res, next);
    };
};