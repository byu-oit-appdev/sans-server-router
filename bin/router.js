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
const schemas               = require('./schemas');

const map = new WeakMap();

module.exports = Router;

/**
 * Create a router instance.
 * @param {object} [configuration]
 * @returns {Router}
 * @constructor
 */
function Router(configuration) {
    const config = schemas.router.normalize(configuration || {});
    const routes = [];

    // create the router function
    const router = function(req, res, next) {
        const server = this;
        const method = req.method.toLowerCase();
        let offset = 0;
        let params;
        let ranRoute = false;
        let route;
        runner();

        function runner() {
            let hasPathMatch = false;
            let match = false;

            // find the next route that matches the path
            for (let i = offset; i < routes.length; i++) {
                offset = i + 1;
                route = routes[i];
                params = route.parser(req.path);
                if (params) {
                    hasPathMatch = true;
                    if (route.method === method || route.method === 'all') {
                        req.params = params;
                        match = true;
                        break;
                    } else {
                         server.log('method-mismatch', route.method.toUpperCase() + ' ' + route.path, route);
                    }
                }
            }

            // if there is no match then exit
            if (!match) {
                if (config.passThrough) {
                    if (ranRoute) server.log('non-terminal', 'Executed routes did not send response.');
                    server.log('next', 'Passing request to next middleware');
                    next();
                } else if (ranRoute) {
                    server.log('non-terminal', 'Executed routes did not send response. Send 404.');
                    res.sendStatus(404);
                } else {
                    const code = hasPathMatch ? 405 : 404;
                    server.log('not-found', 'No matching route found. Send ' + code + '.');
                    res.sendStatus(code);
                }
                return;
            }

            // execute the route
            server.log('execute-route', route.method.toUpperCase() + ' ' + route.path, route);
            ranRoute = true;
            route.runner(req, res, function(err) {
                if (err) return next(err);
                runner();
            });
        }
    };
    Object.assign(router, Router);

    // create the store
    map.set(router, {
        config: config,
        routes: routes
    });

    // return the route
    return router;
}

/**
 * Create a route that works for any method.
 * @param {string} path
 * @param {...function} middleware
 * @returns {Router}
 */
Router.all = function(path, middleware) {
    const args = arguments;
    const router = this;
    definePath(this, 'all', path, args);
    return this;
};

/**
 * Create a route that works for DELETE method.
 * @param {string|RegExp} path
 * @param {...function} middleware
 * @returns {Router}
 */
Router.delete = function(path, middleware) {
    definePath(this, 'delete', path, arguments);
    return this;
};

/**
 * Create a route that works for GET method.
 * @param {string} path
 * @param {...function} middleware
 * @returns {Router}
 */
Router.get = function(path, middleware) {
    definePath(this, 'get', path, arguments);
    return this;
};

/**
 * Create a route that works for HEAD method.
 * @param {string} path
 * @param {...function} middleware
 * @returns {Router}
 */
Router.head = function(path, middleware) {
    definePath(this, 'head', path, arguments);
    return this;
};

/**
 * Create a route that works for OPTIONS method.
 * @param {string} path
 * @param {...function} middleware
 * @returns {Router}
 */
Router.options = function(path, middleware) {
    definePath(this, 'options', path, arguments);
    return this;
};

/**
 * Create a route that works for PATCH method.
 * @param {string} path
 * @param {...function} middleware
 * @returns {Router}
 */
Router.patch = function(path, middleware) {
    definePath(this, 'patch', path, arguments);
    return this;
};

/**
 * Create a route that works for POST method.
 * @param {string} path
 * @param {...function} middleware
 * @returns {Router}
 */
Router.post = function(path, middleware) {
    definePath(this, 'post', path, arguments);
    return this;
};

/**
 * Create a route that works for PUT method.
 * @param {string} path
 * @param {...function} middleware
 * @returns {Router}
 */
Router.put = function(path, middleware) {
    definePath(this, 'put', path, arguments);
    return this;
};

/**
 * Get the routes assigned to the router.
 * @type {Object<string,Array>}
 */
Object.defineProperty(Router, 'routes', {
    get: function() {
        const router = getRouter(this);
        return router.routes;
    }
});

/**
 * List the http methods that have functions.
 * @type {string[]}
 */
Router.methods = ['delete', 'get', 'head', 'options', 'patch', 'post', 'put'];

function definePath(context, method, path, args) {
    const router = getRouter(context);
    const parser = pathParser.parser(path, router.config.paramFormat);
    const runner = getMiddlewareRunner(args);
    router.routes.push({
        method: method,
        parser: parser,
        path: path,
        runner: runner
    });
}

function getMiddlewareRunner(args) {
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
    return function(req, res, next) {
        const chain = middleware.slice(0);
        runMiddleware(this, chain, req, res, next);
    }
}

function getRouter(router) {
    if (map.has(router)) return map.get(router);
    const err = Error('Invalid context. This must be a Router instance. Received: ' + router);
    err.code = 'ESSRCTX';
    throw err;
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