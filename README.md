# Sans-Server-Router

A router middleware built for [Sans-Server](https://npmjs.com/packages/sans-server).

## Table of Contents

- [Example](#example)
- [Defining Routes](#defining-routes)
- [Paths](#paths)
- [Router Options](#router-options)

## Example

```js
const Router        = require('sans-server-router');
const SansServer    = require('sans-server');

// define the server instance
const server = SansServer();

// define the router
const router = Router({
    caseInsensitive: true,
    paramFormat: 'colon'
});

// add the router as middleware
server.use(router);

// define a route with a parameter
router.get('/api/content/:contentId', function(req, res) {
    res.send('You selected content: ' + req.params.contentId);
});

// make a request
server.request({ method: 'GET', path: '/api/content/1234' })
    .then(function(res) {
        console.log(res.body);      // "You selected content: 1234"
    });
```

## Defining Routes

Routes can be defined for the following methods: `delete`, `get`, `head`, `options`, `patch`, `post`, `put`. There is also a method `all` that allows you to define a route for each of those methods.

Each of these methods has the same signature. The `get` method is demonstrated here:

### #get ( path : String|RegExp, ...callback : Function ) : SansServer

**Parameters**

- *path* - The [path definition](#paths). This can be a [static path](#static-paths), a [path with parameters](#parameter-paths), or a [regular expression](#regular-expressions).

    This can be a string or a regular expression. If a string then [parameters](#path-parameters) can be defined and when the route is run those [parameters](#path-parameters) will exist on the request object at `req.params`. If a regular expression is passed in then the match results for that regular expression will be stored on the `req.params` property.

- *callback* - This is a middleware function that takes up to three parameters: `req` the request object, `res` the response object, and `next` a function to call to pass the request down the line to the next handler.

    You can pass any additional callbacks as additional parameters. They will be called so long as `next()` was called by the middleware that proceeded.

    If the last callback calls `next()` then other routes that also match the incoming path will execute. If there are no other matching routes then any remaining middleware functions will execute.

**Example: Static Path**

```js
const Router        = require('sans-server-router');
const SansServer    = require('sans-server');

const router = Router();
const server = SansServer();

server.use(router));

// define static path for GET method
server.get('/path', function(req, res, next) {
    res.send('You hit the endpoint GET /path');
});
```

**Example: Path with Parameters**

```js
router.post('/path/:param1', function(req, res, next) {
    res.send('You hit the endpoint POST /path/:param1 where param1=' + req.params.param1);
});
```

**Example: Path with Chained Middlewares**

```js
router.put('/path',
    function(req, res, next) {
        next();
    },
    function(req, res, next) {
        res.send('Done');
    }
);
```

**Example: Multiple Path Matches**

Both of these routes will run their associated middleware functions when a request to `GET /path/foo` is made.

```js
// because this is defined first /path/foo will go here first, but only /path/foo
router.get('/path/foo', function(req, res, next) {
    req.isFoo = true;
    next();
});

// this will match many paths
router.get('/path/:name', function(req, res, next) {
    res.send('Path ' + req.params.name ' is foo? ' + req.isFoo);
});
```

**Example: Router Declines to Respond**

Because the router is calling middleware functions, the middleware function does not need to provide a response. It can call the `next()` function instead.

```js
const Router        = require('sans-server-router');
const SansServer    = require('sans-server');

const server = SansServer();
const router = Router();
server.use(router);

// because this middleware is added after the router middleware, it won't be called unless
// the router passes the request through with next()
server.use(function(req, res, next) {
    res.send(req.foo);  // "bar"
});

// route gets everything but just calls next()
router.get('*', function(req, res, next) {
    req.foo = 'bar';
    next();
});
```

## Paths

When a path matches it will begin to call each middleware that is assigned to that route. Before it calls each middleware it will add a property to the request object `req.params` that will be an object containing information about the path's parameter values.

### Static Paths

Static paths have no parameters and must match the incoming request path exactly. The `req.params` object will be an empty object `{}`.

### Parameter Paths

Paths can have parameters defined in three formats: `colon` the default, `handlebar`, or `doubleHandlebar`. The format must be consistent for each router instance and is defined with the [instantiation of the middleware](#router-options). Regardless of the format used, the paths are parsed the same.

Once a route is selected, the values for the parameters are stored on an object in the request: `req.params`. This object's properties are the names of the parameters and it's values are taken from the path.

#### Parameter Formats

- *colon* - `/path/:param` - The parameter is defined with a colon.
- *handlebar* - `/path/{param}` - The parameter is surrounded by handlebars.
- *doubleHandlebar* - `/path/{{param}}` - The parameter is surrounded by double handlebars.

#### Wildcards

Use wildcards to allow matching across path delimiters.

- `*` will match everything.
- `/path/*` will match `/path/foo`, `/path/bar`, etc. but will not match just `/path`.
- `/path/:foo*` will match `/path/abc/def` etc.
- `:lead*/dest` will match `/abc/xyz/dest` or anything else that ends with `dest`.

#### Optional Parameters

A parameter name followed by a `?` is an optional parameter.

- `/path/:optParam?` will match `/path` and `/path/foo`.
- `/:param?/path` will match `/path` and `abc/path`.

### Regular Expressions

In place of using strings to define the route path you can instead define a regular expression. If the regular expression matches an incoming request then the matched results will be set into the `req.params` property.

```js
router.get(/(\d+)/, function(req, res, next) {
    res.send('Path parameter: ' + req.params[0]);
});
```

## Router Options

The router has some options that can be configured that affect the way that routing occurs.

### caseInsensitive

Defaults to `true`.

Setting this option to `false` will require that the letter case (upper or lower) must match the defined path.

### paramFormat

Defaults to `"colon"` but can also be set to `"handlebar"` or `"doubleHandlebar"`.

This option affects how you write your path parameters. For example:

- *colon* - `'/path/:param1'`
- *handlebar* - `'/path/{param1}'`
- *doubleHandlebar* - `'/path/{{param1}}'`

TODO: talk about configuarion options and middleware initialization