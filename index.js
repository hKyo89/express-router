const $ = require('config');
const _ = require('lodash');
const path = require('path');

class Router {
  constructor(app) {
    this._ = {};
    this.setup();
    this.use(app);
  }

  use(app) {
    this._.routes.map((route) => {
      if (route.disabled) {
        return;
      }

      let router;

      try {
        router = require(route.path);
      } catch (e) {
        if (e.code !== 'MODULE_NOT_FOUND') {
          throw e;
        }
        throw new Error(`Router module not found for '${route.module}'`);
      }

      if (route.ajax) {
        app.use(route.ajax, router);

        if (route.xhr) {
          return;
        }
      }

      app.use(route.route, router);
    });
  }

  setBaseRoute() {
    return this._.base = `${ ($.router.baseRoute || '/')}/`.replace(/^\/+/, '/');
  }

  setup() {
    this.setBaseRoute();

    if (_.isUndefined(this._.routes)) {
      this._.routes = [];

      $.router.routes.map((route) => {
        let tmp = Object.assign(route);
        this.setDefaultProperties(tmp);
        this._.routes.push(tmp);
      });
    }
    return this._.routes;
  }

  setDefaultProperties(route) {
    route.route = route.route.replace(/^\/*/, `${this._.base}`);
    route.module = (route.module || route.route).replace(/^\/*/, '');

    const defaultProperties = {
      path: path.join($.router.basePath, route.module),
      disabled: undefined,
      test: undefined,
      ajax: undefined,
      xhr: undefined
    };

    const properties = Object.keys(defaultProperties);

    properties.map((prop) => {
      if (prop === 'ajax') {
        if (route.ajax) {
          route.ajax = `${this._.base}/ajax/${route.module}`;
          route.ajax = route.ajax.replace(/\/+/g, '/');
        }
      }

      if (_.isUndefined(route[prop])) {
        route[prop] = defaultProperties[prop];
      }
    });
    return route;
  }

  locals(req, res, next) {
    if (typeof req.query !== 'undefined') {
      res.locals.query = req.query;
    }
    return next();
  }
}

module.exports = Router;
