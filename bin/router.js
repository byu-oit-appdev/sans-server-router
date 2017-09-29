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
const pathParser            = require('./path-parser');
const Middleware            = require('sans-server-middleware');

const methods = ['delete', 'get', 'head', 'options', 'patch', 'post', 'put'];

/**
 *
 * @param configuration
 * @returns {Router}
 */
module.exports = function(configuration) {
    const config = getConfig(configuration);
    const routes = [];

    function defineRoute(method, path, args) {

        // create middleware runner
        const middleware = new Middleware('router');
        for (let i = 1; i < args.length; i++) middleware.add(args[i]);

        // store route
        routes.push({
            method: method.toUpperCase(),
            parser: pathParser.parser(path, config.paramFormat, !config.caseInsensitive),
            path: path,
            middleware: middleware
        });

        return router;
    }

    // define the router middleware
    const router = function Router(req, res, next) {
        const server = this;
        const state = {
            method: req.method.toUpperCase(),
            params: {},
            routes: routes.concat(),
            routeUnhandled: true,
            server: server,
        };
        run(state, req, res, err => {
            req.params = {};
            if (state.routeUnhandled) req.log('unhandled', 'Router had no matching paths');
            next(err);
        });
    };

    // add static properties to the router function
    router.all = function(path, middleware) { return defineRoute('all', path, arguments) };
    methods.forEach(method => router[method] = function(path, middleware) { return defineRoute(method, path, arguments) });
    Object.defineProperty(router, 'routes', { enumerable: true, value: routes });

    return router;
};





/**
 * Router middleware.
 * @function Router
 * @constructor
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */

/**
 * @function Router#all
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @function Router#delete
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @function Router#get
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @function Router#head
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @function Router#options
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @function Router#patch
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @function Router#post
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @function Router#put
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @name Router#routes
 * @type {Array}
 */


/**
 * @private
 * @param configuration
 * @returns {{caseInsensitive: boolean, paramFormat: string}}
 */
function getConfig(configuration) {
    if (!configuration) configuration = {};
    const config = {
        caseInsensitive: configuration.hasOwnProperty('caseInsensitive') ? !!configuration.caseInsensitive : true,
        paramFormat: configuration.paramFormat || 'colon'
    };
    if (config.paramFormat !== 'colon' && config.paramFormat !== 'handlebar' && config.paramFormat !== 'doubleHandlebar') {
        throw Error('Invalid configuration value for paramFormat. ' +
            'Expected one of: colon, handlebar, doubleHandlebar. Received: ' + config.paramFormat);
    }
    return config;
}

/**
 * @private
 * @param state
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function run(state, req, res, next) {
    let route;

    // run is complete
    if (state.routes.length === 0) return next();

    // test each route and execute matching routes
    while (route = state.routes.shift()) {
        const params = route.parser(req.path);
        if (params && (route.method === state.method || route.method === 'all')) {
            state.routeUnhandled = false;
            req.params = params;
            route.middleware.run(req, res, function(err) {
                if (err || res.sent || !state.routes.length) return next(err);
                run(state, req, res, next);
            });
            return;
        }
    }

    next();
}