# Sans-Server-Router

A router middleware built for [Sans-Server](https://npmjs.com/packages/sans-server).

## Example

```js
const router        = require('sans-server-router');
const SansServer    = require('sans-server');

// define the server instance
server = SansServer();

// add router methods to the server and implement router middleware
server.use(router(server));

// define a route with a required parameter
server.get('/api/content/:contentId', function(req, res) {
    res.send('You selected content: ' + req.params.contentId);
});

// make a request
server.request({ method: 'GET', path: '/api/content/1234' })
    .then(function(res) {
        console.log(res.body);      // "You selected content: 1234"
    });
```

This middleware performs two operations:

1. It adds methods to the SansServer instance. Those methods are used to [define routes](#defining-routes).
2. It evaluates each request and determines whether a [defined route](#defining-routes) should handler the request.

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
const router        = require('sans-server-router');
const SansServer    = require('sans-server');
server.use(router(server));

// define static path for GET method
server.get('/path', function(req, res, next) {
    res.send('You hit the endpoint GET /path');
});
```

**Example: Path with Parameters**

```js
server.post('/path/:param1', function(req, res, next) {
    res.send('You hit the endpoint POST /path/:param1 where param1=' + req.params.param1);
});
```

**Example: Path with Multiple Middlewares**

```js
server.put('/path',
    function(req, res, next) {
        next();
    },
    function(req, res, next) {
        res.send('Done');
    }
);
```

**Example: Multiple Path Matches**

```js
// because this is defined first /path/foo will go here first, but only /path/foo
server.get('/path/foo', function(req, res, next) {
    req.isFoo = true;
    next();
});

// this will match many paths
server.get('/path/:name', function(req, res, next) {
    res.send('Path ' + req.params.name ' is foo? ' + req.isFoo);
});
```

**Example: Router Declines to Respond**

```js
const router        = require('sans-server-router');
const SansServer    = require('sans-server');

server = SansServer();
server.use(router(server));

// because this middleware is added after the router, it won't be called unless
// the router passes the request through with next()
server.use(function(req, res, next) {
    res.send(req.foo);  // "bar"
});

// route gets everything but just calls next()
server.get('*', function(req, res, next) {
    req.foo = 'bar';
    next();
});
```

## Paths

When a path matches it will begin to call each middleware that is assigned to that route. Before it calls each middleware it will add a property to the request object `req.params` that will be an object containing information about the path's parameter values.

### Static Paths

Static paths have no parameters and must match the incoming request path exactly. The `req.params` object will be an empty object `{}`.

### Parameter Paths

Paths can have parameters defined in three formats: `colon` the default, `handlebar`, or `doubleHandlebar`. The format must be consistent for each router instance and is defined with the [instantiation of the middleware](#middleare-options). Regardless of the format used, the paths are parsed the same.

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

## Middleware Options

TODO: talk about configuarion options and middleware initialization