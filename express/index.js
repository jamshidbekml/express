const http = require('http');
const bodyParser = require('body-parser');

class App {
    constructor() {
        this.routes = {
            GET: {},
            POST: {},
            PUT: {},
            DELETE: {},
        };
        this.middleware = [];
    }

    use(path, middleware) {
        if (typeof path === 'function') {
            this.middleware.push(path);
        } else if (typeof middleware === 'function') {
            this.middleware.push((req, res, next) => {
                if (req.url === path) {
                    middleware(req, res, next);
                } else {
                    next();
                }
            });
        }
    }

    get(path, handler) {
        this.routes.GET[path] = handler;
    }

    post(path, handler) {
        this.routes.POST[path] = handler;
    }

    put(path, handler) {
        this.routes.PUT[path] = handler;
    }

    delete(path, handler) {
        this.routes.DELETE[path] = handler;
    }

    handleRequest(req, res) {
        const { url, method } = req;
        res.status = (code) => {
            res.statusCode = code;
            return res;
        };
        res.send = (data) => {
            res.end(JSON.stringify(data));
        };
        res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
        };

        this.executeMiddleware(req, res, () => {
            const queryString = url.split('?')[1] || '';
            const queryParams = this.parseQueryParams(queryString);

            req.query = queryParams;
            let handler = null;

            if (this.routes[method]) {
                const matchingRoutes = Object.keys(this.routes[method]).filter(
                    (route) => {
                        const routeSegments = route.split('/');
                        const urlSegments = url.split('/');

                        if (routeSegments.length !== urlSegments.length) {
                            return false;
                        }

                        for (let i = 0; i < routeSegments.length; i++) {
                            if (
                                routeSegments[i] !== urlSegments[i] &&
                                !routeSegments[i].startsWith(':')
                            ) {
                                return false;
                            }
                        }

                        return true;
                    }
                );

                if (matchingRoutes.length > 0) {
                    const matchingRoute = matchingRoutes[0];
                    handler = this.routes[method][matchingRoute];

                    const routeSegments = matchingRoute.split('/');
                    const urlSegments = url.split('/');
                    req.params = {};

                    for (let i = 0; i < routeSegments.length; i++) {
                        if (routeSegments[i].startsWith(':')) {
                            const paramName = routeSegments[i].substring(1);
                            const paramValue = urlSegments[i];
                            req.params[paramName] = paramValue;
                        }
                    }
                }
            }

            if (handler) {
                handler(req, res);
            } else {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                    JSON.stringify({
                        statusCode: 404,
                        message: `Cannot ${method} ${url}`,
                        error: 'Not Found',
                    })
                );
            }
        });
    }

    executeMiddleware(req, res, callback) {
        let currentIndex = 0;

        const executeNextMiddleware = () => {
            if (currentIndex < this.middleware.length) {
                const currentMiddleware = this.middleware[currentIndex];
                currentIndex++;

                if (typeof currentMiddleware === 'function') {
                    currentMiddleware(req, res, executeNextMiddleware);
                } else {
                    console.error('Error: Middleware is not a function');
                    callback();
                }
            } else {
                callback();
            }
        };

        executeNextMiddleware();
    }

    parseQueryParams(queryString) {
        const queryParams = {};

        if (queryString) {
            const pairs = queryString.split('&');

            for (const pair of pairs) {
                const [key, value] = pair.split('=');
                const decodedKey = decodeURIComponent(key);
                const decodedValue = decodeURIComponent(value);

                queryParams[decodedKey] = decodedValue;
            }
        }

        return queryParams;
    }

    listen(port, callback) {
        const server = http.createServer(this.handleRequest.bind(this));
        server.listen(port, callback);
    }
}

const express = () => new App();
express.json = () => bodyParser.json();

module.exports = express;
