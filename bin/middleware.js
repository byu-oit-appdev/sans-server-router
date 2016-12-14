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
    const router = Router(configuration, methods);

    // add functions to the sans-server instance
    sansServer.all = router.all;
    methods.forEach(function(method) {
        if (Router.prototype[method]) sansServer[method] = router[method];
    });

    // return middleware function
    return function sansServerRouter(req, res, next) {
        const method = req.method.toLowerCase();
        const routes = router.routes.hasOwnProperty(method) ? router.routes[method] : [];
        for (let i = 0; i < routes.length; i++) {
            const params = routes[i].parser(req.path);
            if (params) {
                routes[i].runner(req, res, next);
                break;
            }
        }
    };
};