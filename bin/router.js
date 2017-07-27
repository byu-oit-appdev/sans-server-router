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

        // validate each supplied middleware for route
        const middleware = [];
        for (let i = 1; i < args.length; i++) {
            const mw = args[i];
            if (typeof mw !== 'function') {
                const err = Error('Invalid path handler specified. Expected a function. Received: ' + mw);
                err.code = 'ESSRHDLR';
                throw err;
            }
            middleware.push(mw);
        }

        routes.push({
            method: method.toUpperCase(),
            parser: pathParser.parser(path, config.paramFormat, !config.caseInsensitive),
            path: path,
            runner: function(req, res, next) {
                const chain = middleware.slice(0);
                runMiddleware(this, chain, req, res, next);
            }
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
        run(state, req, res, () => {
            req.params = {};
            if (state.routeUnhandled) server.log('unhandled', 'Router had no matching paths', {});
            next();
        });
    };

    // add static properties to the router function
    router.all = function(path, middleware) { return defineRoute('all', path, arguments) };
    methods.forEach(method => router[method] = function(path, middleware) { return defineRoute(method, path, arguments) });
    Object.defineProperty(router, 'routes', { enumerable: true, value: routes });

    return router;
};

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

            state.server.log('execute-handler', route.method + ' ' + route.path, route);
            route.runner.call(state.server, req, res, () => {
                run(state, req, res, next);
            });

            return;
        }
    }

    next();
}



/**
 * Router middleware.
 * @function Router
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */

/**
 * @memberOf Router
 * @static
 * @function all
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @memberOf Router
 * @static
 * @function delete
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @memberOf Router
 * @static
 * @function get
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @memberOf Router
 * @static
 * @function head
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @memberOf Router
 * @static
 * @function options
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @memberOf Router
 * @static
 * @function patch
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @memberOf Router
 * @static
 * @function post
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @memberOf Router
 * @static
 * @function put
 * @param {string} path
 * @param {...Function} handler
 * @returns {Router}
 */

/**
 * @memberOf Router
 * @static
 * @name routes
 * @type {Array}
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

function runMiddleware(context, chain, req, res, next) {
    if (chain.length > 0 && !res.sent) {
        const callback = chain.shift();
        try {
            callback.call(context, req, res, function (err) {
                if (err && !res.sent) return res.send(err);
                runMiddleware(context, chain, req, res, next);
            });
        } catch (e) {
            res.send(e);
        }
    } else if (!res.sent) {
        next();
    }
}