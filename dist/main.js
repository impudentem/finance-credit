 /*
 * # Semantic UI - 2.2.11
 * https://github.com/Semantic-Org/Semantic-UI
 * http://www.semantic-ui.com/
 *
 * Copyright 2014 Contributors
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */
/**
 * @license AngularJS v1.6.5
 * (c) 2010-2017 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

/* global shallowCopy: true */

/**
 * Creates a shallow copy of an object, an array or a primitive.
 *
 * Assumes that there are no proto properties for objects.
 */
function shallowCopy(src, dst) {
  if (isArray(src)) {
    dst = dst || [];

    for (var i = 0, ii = src.length; i < ii; i++) {
      dst[i] = src[i];
    }
  } else if (isObject(src)) {
    dst = dst || {};

    for (var key in src) {
      if (!(key.charAt(0) === '$' && key.charAt(1) === '$')) {
        dst[key] = src[key];
      }
    }
  }

  return dst || src;
}

/* global shallowCopy: false */

// `isArray` and `isObject` are necessary for `shallowCopy()` (included via `src/shallowCopy.js`).
// They are initialized inside the `$RouteProvider`, to ensure `window.angular` is available.
var isArray;
var isObject;
var isDefined;
var noop;

/**
 * @ngdoc module
 * @name ngRoute
 * @description
 *
 * # ngRoute
 *
 * The `ngRoute` module provides routing and deeplinking services and directives for angular apps.
 *
 * ## Example
 * See {@link ngRoute.$route#example $route} for an example of configuring and using `ngRoute`.
 *
 *
 * <div doc-module-components="ngRoute"></div>
 */
/* global -ngRouteModule */
var ngRouteModule = angular.
  module('ngRoute', []).
  info({ angularVersion: '1.6.5' }).
  provider('$route', $RouteProvider).
  // Ensure `$route` will be instantiated in time to capture the initial `$locationChangeSuccess`
  // event (unless explicitly disabled). This is necessary in case `ngView` is included in an
  // asynchronously loaded template.
  run(instantiateRoute);
var $routeMinErr = angular.$$minErr('ngRoute');
var isEagerInstantiationEnabled;


/**
 * @ngdoc provider
 * @name $routeProvider
 * @this
 *
 * @description
 *
 * Used for configuring routes.
 *
 * ## Example
 * See {@link ngRoute.$route#example $route} for an example of configuring and using `ngRoute`.
 *
 * ## Dependencies
 * Requires the {@link ngRoute `ngRoute`} module to be installed.
 */
function $RouteProvider() {
  isArray = angular.isArray;
  isObject = angular.isObject;
  isDefined = angular.isDefined;
  noop = angular.noop;

  function inherit(parent, extra) {
    return angular.extend(Object.create(parent), extra);
  }

  var routes = {};

  /**
   * @ngdoc method
   * @name $routeProvider#when
   *
   * @param {string} path Route path (matched against `$location.path`). If `$location.path`
   *    contains redundant trailing slash or is missing one, the route will still match and the
   *    `$location.path` will be updated to add or drop the trailing slash to exactly match the
   *    route definition.
   *
   *    * `path` can contain named groups starting with a colon: e.g. `:name`. All characters up
   *        to the next slash are matched and stored in `$routeParams` under the given `name`
   *        when the route matches.
   *    * `path` can contain named groups starting with a colon and ending with a star:
   *        e.g.`:name*`. All characters are eagerly stored in `$routeParams` under the given `name`
   *        when the route matches.
   *    * `path` can contain optional named groups with a question mark: e.g.`:name?`.
   *
   *    For example, routes like `/color/:color/largecode/:largecode*\/edit` will match
   *    `/color/brown/largecode/code/with/slashes/edit` and extract:
   *
   *    * `color: brown`
   *    * `largecode: code/with/slashes`.
   *
   *
   * @param {Object} route Mapping information to be assigned to `$route.current` on route
   *    match.
   *
   *    Object properties:
   *
   *    - `controller` – `{(string|Function)=}` – Controller fn that should be associated with
   *      newly created scope or the name of a {@link angular.Module#controller registered
   *      controller} if passed as a string.
   *    - `controllerAs` – `{string=}` – An identifier name for a reference to the controller.
   *      If present, the controller will be published to scope under the `controllerAs` name.
   *    - `template` – `{(string|Function)=}` – html template as a string or a function that
   *      returns an html template as a string which should be used by {@link
   *      ngRoute.directive:ngView ngView} or {@link ng.directive:ngInclude ngInclude} directives.
   *      This property takes precedence over `templateUrl`.
   *
   *      If `template` is a function, it will be called with the following parameters:
   *
   *      - `{Array.<Object>}` - route parameters extracted from the current
   *        `$location.path()` by applying the current route
   *
   *      One of `template` or `templateUrl` is required.
   *
   *    - `templateUrl` – `{(string|Function)=}` – path or function that returns a path to an html
   *      template that should be used by {@link ngRoute.directive:ngView ngView}.
   *
   *      If `templateUrl` is a function, it will be called with the following parameters:
   *
   *      - `{Array.<Object>}` - route parameters extracted from the current
   *        `$location.path()` by applying the current route
   *
   *      One of `templateUrl` or `template` is required.
   *
   *    - `resolve` - `{Object.<string, Function>=}` - An optional map of dependencies which should
   *      be injected into the controller. If any of these dependencies are promises, the router
   *      will wait for them all to be resolved or one to be rejected before the controller is
   *      instantiated.
   *      If all the promises are resolved successfully, the values of the resolved promises are
   *      injected and {@link ngRoute.$route#$routeChangeSuccess $routeChangeSuccess} event is
   *      fired. If any of the promises are rejected the
   *      {@link ngRoute.$route#$routeChangeError $routeChangeError} event is fired.
   *      For easier access to the resolved dependencies from the template, the `resolve` map will
   *      be available on the scope of the route, under `$resolve` (by default) or a custom name
   *      specified by the `resolveAs` property (see below). This can be particularly useful, when
   *      working with {@link angular.Module#component components} as route templates.<br />
   *      <div class="alert alert-warning">
   *        **Note:** If your scope already contains a property with this name, it will be hidden
   *        or overwritten. Make sure, you specify an appropriate name for this property, that
   *        does not collide with other properties on the scope.
   *      </div>
   *      The map object is:
   *
   *      - `key` – `{string}`: a name of a dependency to be injected into the controller.
   *      - `factory` - `{string|Function}`: If `string` then it is an alias for a service.
   *        Otherwise if function, then it is {@link auto.$injector#invoke injected}
   *        and the return value is treated as the dependency. If the result is a promise, it is
   *        resolved before its value is injected into the controller. Be aware that
   *        `ngRoute.$routeParams` will still refer to the previous route within these resolve
   *        functions.  Use `$route.current.params` to access the new route parameters, instead.
   *
   *    - `resolveAs` - `{string=}` - The name under which the `resolve` map will be available on
   *      the scope of the route. If omitted, defaults to `$resolve`.
   *
   *    - `redirectTo` – `{(string|Function)=}` – value to update
   *      {@link ng.$location $location} path with and trigger route redirection.
   *
   *      If `redirectTo` is a function, it will be called with the following parameters:
   *
   *      - `{Object.<string>}` - route parameters extracted from the current
   *        `$location.path()` by applying the current route templateUrl.
   *      - `{string}` - current `$location.path()`
   *      - `{Object}` - current `$location.search()`
   *
   *      The custom `redirectTo` function is expected to return a string which will be used
   *      to update `$location.url()`. If the function throws an error, no further processing will
   *      take place and the {@link ngRoute.$route#$routeChangeError $routeChangeError} event will
   *      be fired.
   *
   *      Routes that specify `redirectTo` will not have their controllers, template functions
   *      or resolves called, the `$location` will be changed to the redirect url and route
   *      processing will stop. The exception to this is if the `redirectTo` is a function that
   *      returns `undefined`. In this case the route transition occurs as though there was no
   *      redirection.
   *
   *    - `resolveRedirectTo` – `{Function=}` – a function that will (eventually) return the value
   *      to update {@link ng.$location $location} URL with and trigger route redirection. In
   *      contrast to `redirectTo`, dependencies can be injected into `resolveRedirectTo` and the
   *      return value can be either a string or a promise that will be resolved to a string.
   *
   *      Similar to `redirectTo`, if the return value is `undefined` (or a promise that gets
   *      resolved to `undefined`), no redirection takes place and the route transition occurs as
   *      though there was no redirection.
   *
   *      If the function throws an error or the returned promise gets rejected, no further
   *      processing will take place and the
   *      {@link ngRoute.$route#$routeChangeError $routeChangeError} event will be fired.
   *
   *      `redirectTo` takes precedence over `resolveRedirectTo`, so specifying both on the same
   *      route definition, will cause the latter to be ignored.
   *
   *    - `[reloadOnSearch=true]` - `{boolean=}` - reload route when only `$location.search()`
   *      or `$location.hash()` changes.
   *
   *      If the option is set to `false` and url in the browser changes, then
   *      `$routeUpdate` event is broadcasted on the root scope.
   *
   *    - `[caseInsensitiveMatch=false]` - `{boolean=}` - match routes without being case sensitive
   *
   *      If the option is set to `true`, then the particular route can be matched without being
   *      case sensitive
   *
   * @returns {Object} self
   *
   * @description
   * Adds a new route definition to the `$route` service.
   */
  this.when = function(path, route) {
    //copy original route object to preserve params inherited from proto chain
    var routeCopy = shallowCopy(route);
    if (angular.isUndefined(routeCopy.reloadOnSearch)) {
      routeCopy.reloadOnSearch = true;
    }
    if (angular.isUndefined(routeCopy.caseInsensitiveMatch)) {
      routeCopy.caseInsensitiveMatch = this.caseInsensitiveMatch;
    }
    routes[path] = angular.extend(
      routeCopy,
      path && pathRegExp(path, routeCopy)
    );

    // create redirection for trailing slashes
    if (path) {
      var redirectPath = (path[path.length - 1] === '/')
            ? path.substr(0, path.length - 1)
            : path + '/';

      routes[redirectPath] = angular.extend(
        {redirectTo: path},
        pathRegExp(redirectPath, routeCopy)
      );
    }

    return this;
  };

  /**
   * @ngdoc property
   * @name $routeProvider#caseInsensitiveMatch
   * @description
   *
   * A boolean property indicating if routes defined
   * using this provider should be matched using a case insensitive
   * algorithm. Defaults to `false`.
   */
  this.caseInsensitiveMatch = false;

   /**
    * @param path {string} path
    * @param opts {Object} options
    * @return {?Object}
    *
    * @description
    * Normalizes the given path, returning a regular expression
    * and the original path.
    *
    * Inspired by pathRexp in visionmedia/express/lib/utils.js.
    */
  function pathRegExp(path, opts) {
    var insensitive = opts.caseInsensitiveMatch,
        ret = {
          originalPath: path,
          regexp: path
        },
        keys = ret.keys = [];

    path = path
      .replace(/([().])/g, '\\$1')
      .replace(/(\/)?:(\w+)(\*\?|[?*])?/g, function(_, slash, key, option) {
        var optional = (option === '?' || option === '*?') ? '?' : null;
        var star = (option === '*' || option === '*?') ? '*' : null;
        keys.push({ name: key, optional: !!optional });
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (star && '(.+?)' || '([^/]+)')
          + (optional || '')
          + ')'
          + (optional || '');
      })
      .replace(/([/$*])/g, '\\$1');

    ret.regexp = new RegExp('^' + path + '$', insensitive ? 'i' : '');
    return ret;
  }

  /**
   * @ngdoc method
   * @name $routeProvider#otherwise
   *
   * @description
   * Sets route definition that will be used on route change when no other route definition
   * is matched.
   *
   * @param {Object|string} params Mapping information to be assigned to `$route.current`.
   * If called with a string, the value maps to `redirectTo`.
   * @returns {Object} self
   */
  this.otherwise = function(params) {
    if (typeof params === 'string') {
      params = {redirectTo: params};
    }
    this.when(null, params);
    return this;
  };

  /**
   * @ngdoc method
   * @name $routeProvider#eagerInstantiationEnabled
   * @kind function
   *
   * @description
   * Call this method as a setter to enable/disable eager instantiation of the
   * {@link ngRoute.$route $route} service upon application bootstrap. You can also call it as a
   * getter (i.e. without any arguments) to get the current value of the
   * `eagerInstantiationEnabled` flag.
   *
   * Instantiating `$route` early is necessary for capturing the initial
   * {@link ng.$location#$locationChangeStart $locationChangeStart} event and navigating to the
   * appropriate route. Usually, `$route` is instantiated in time by the
   * {@link ngRoute.ngView ngView} directive. Yet, in cases where `ngView` is included in an
   * asynchronously loaded template (e.g. in another directive's template), the directive factory
   * might not be called soon enough for `$route` to be instantiated _before_ the initial
   * `$locationChangeSuccess` event is fired. Eager instantiation ensures that `$route` is always
   * instantiated in time, regardless of when `ngView` will be loaded.
   *
   * The default value is true.
   *
   * **Note**:<br />
   * You may want to disable the default behavior when unit-testing modules that depend on
   * `ngRoute`, in order to avoid an unexpected request for the default route's template.
   *
   * @param {boolean=} enabled - If provided, update the internal `eagerInstantiationEnabled` flag.
   *
   * @returns {*} The current value of the `eagerInstantiationEnabled` flag if used as a getter or
   *     itself (for chaining) if used as a setter.
   */
  isEagerInstantiationEnabled = true;
  this.eagerInstantiationEnabled = function eagerInstantiationEnabled(enabled) {
    if (isDefined(enabled)) {
      isEagerInstantiationEnabled = enabled;
      return this;
    }

    return isEagerInstantiationEnabled;
  };


  this.$get = ['$rootScope',
               '$location',
               '$routeParams',
               '$q',
               '$injector',
               '$templateRequest',
               '$sce',
               '$browser',
      function($rootScope, $location, $routeParams, $q, $injector, $templateRequest, $sce, $browser) {

    /**
     * @ngdoc service
     * @name $route
     * @requires $location
     * @requires $routeParams
     *
     * @property {Object} current Reference to the current route definition.
     * The route definition contains:
     *
     *   - `controller`: The controller constructor as defined in the route definition.
     *   - `locals`: A map of locals which is used by {@link ng.$controller $controller} service for
     *     controller instantiation. The `locals` contain
     *     the resolved values of the `resolve` map. Additionally the `locals` also contain:
     *
     *     - `$scope` - The current route scope.
     *     - `$template` - The current route template HTML.
     *
     *     The `locals` will be assigned to the route scope's `$resolve` property. You can override
     *     the property name, using `resolveAs` in the route definition. See
     *     {@link ngRoute.$routeProvider $routeProvider} for more info.
     *
     * @property {Object} routes Object with all route configuration Objects as its properties.
     *
     * @description
     * `$route` is used for deep-linking URLs to controllers and views (HTML partials).
     * It watches `$location.url()` and tries to map the path to an existing route definition.
     *
     * Requires the {@link ngRoute `ngRoute`} module to be installed.
     *
     * You can define routes through {@link ngRoute.$routeProvider $routeProvider}'s API.
     *
     * The `$route` service is typically used in conjunction with the
     * {@link ngRoute.directive:ngView `ngView`} directive and the
     * {@link ngRoute.$routeParams `$routeParams`} service.
     *
     * @example
     * This example shows how changing the URL hash causes the `$route` to match a route against the
     * URL, and the `ngView` pulls in the partial.
     *
     * <example name="$route-service" module="ngRouteExample"
     *          deps="angular-route.js" fixBase="true">
     *   <file name="index.html">
     *     <div ng-controller="MainController">
     *       Choose:
     *       <a href="Book/Moby">Moby</a> |
     *       <a href="Book/Moby/ch/1">Moby: Ch1</a> |
     *       <a href="Book/Gatsby">Gatsby</a> |
     *       <a href="Book/Gatsby/ch/4?key=value">Gatsby: Ch4</a> |
     *       <a href="Book/Scarlet">Scarlet Letter</a><br/>
     *
     *       <div ng-view></div>
     *
     *       <hr />
     *
     *       <pre>$location.path() = {{$location.path()}}</pre>
     *       <pre>$route.current.templateUrl = {{$route.current.templateUrl}}</pre>
     *       <pre>$route.current.params = {{$route.current.params}}</pre>
     *       <pre>$route.current.scope.name = {{$route.current.scope.name}}</pre>
     *       <pre>$routeParams = {{$routeParams}}</pre>
     *     </div>
     *   </file>
     *
     *   <file name="book.html">
     *     controller: {{name}}<br />
     *     Book Id: {{params.bookId}}<br />
     *   </file>
     *
     *   <file name="chapter.html">
     *     controller: {{name}}<br />
     *     Book Id: {{params.bookId}}<br />
     *     Chapter Id: {{params.chapterId}}
     *   </file>
     *
     *   <file name="script.js">
     *     angular.module('ngRouteExample', ['ngRoute'])
     *
     *      .controller('MainController', function($scope, $route, $routeParams, $location) {
     *          $scope.$route = $route;
     *          $scope.$location = $location;
     *          $scope.$routeParams = $routeParams;
     *      })
     *
     *      .controller('BookController', function($scope, $routeParams) {
     *          $scope.name = 'BookController';
     *          $scope.params = $routeParams;
     *      })
     *
     *      .controller('ChapterController', function($scope, $routeParams) {
     *          $scope.name = 'ChapterController';
     *          $scope.params = $routeParams;
     *      })
     *
     *     .config(function($routeProvider, $locationProvider) {
     *       $routeProvider
     *        .when('/Book/:bookId', {
     *         templateUrl: 'book.html',
     *         controller: 'BookController',
     *         resolve: {
     *           // I will cause a 1 second delay
     *           delay: function($q, $timeout) {
     *             var delay = $q.defer();
     *             $timeout(delay.resolve, 1000);
     *             return delay.promise;
     *           }
     *         }
     *       })
     *       .when('/Book/:bookId/ch/:chapterId', {
     *         templateUrl: 'chapter.html',
     *         controller: 'ChapterController'
     *       });
     *
     *       // configure html5 to get links working on jsfiddle
     *       $locationProvider.html5Mode(true);
     *     });
     *
     *   </file>
     *
     *   <file name="protractor.js" type="protractor">
     *     it('should load and compile correct template', function() {
     *       element(by.linkText('Moby: Ch1')).click();
     *       var content = element(by.css('[ng-view]')).getText();
     *       expect(content).toMatch(/controller: ChapterController/);
     *       expect(content).toMatch(/Book Id: Moby/);
     *       expect(content).toMatch(/Chapter Id: 1/);
     *
     *       element(by.partialLinkText('Scarlet')).click();
     *
     *       content = element(by.css('[ng-view]')).getText();
     *       expect(content).toMatch(/controller: BookController/);
     *       expect(content).toMatch(/Book Id: Scarlet/);
     *     });
     *   </file>
     * </example>
     */

    /**
     * @ngdoc event
     * @name $route#$routeChangeStart
     * @eventType broadcast on root scope
     * @description
     * Broadcasted before a route change. At this  point the route services starts
     * resolving all of the dependencies needed for the route change to occur.
     * Typically this involves fetching the view template as well as any dependencies
     * defined in `resolve` route property. Once  all of the dependencies are resolved
     * `$routeChangeSuccess` is fired.
     *
     * The route change (and the `$location` change that triggered it) can be prevented
     * by calling `preventDefault` method of the event. See {@link ng.$rootScope.Scope#$on}
     * for more details about event object.
     *
     * @param {Object} angularEvent Synthetic event object.
     * @param {Route} next Future route information.
     * @param {Route} current Current route information.
     */

    /**
     * @ngdoc event
     * @name $route#$routeChangeSuccess
     * @eventType broadcast on root scope
     * @description
     * Broadcasted after a route change has happened successfully.
     * The `resolve` dependencies are now available in the `current.locals` property.
     *
     * {@link ngRoute.directive:ngView ngView} listens for the directive
     * to instantiate the controller and render the view.
     *
     * @param {Object} angularEvent Synthetic event object.
     * @param {Route} current Current route information.
     * @param {Route|Undefined} previous Previous route information, or undefined if current is
     * first route entered.
     */

    /**
     * @ngdoc event
     * @name $route#$routeChangeError
     * @eventType broadcast on root scope
     * @description
     * Broadcasted if a redirection function fails or any redirection or resolve promises are
     * rejected.
     *
     * @param {Object} angularEvent Synthetic event object
     * @param {Route} current Current route information.
     * @param {Route} previous Previous route information.
     * @param {Route} rejection The thrown error or the rejection reason of the promise. Usually
     * the rejection reason is the error that caused the promise to get rejected.
     */

    /**
     * @ngdoc event
     * @name $route#$routeUpdate
     * @eventType broadcast on root scope
     * @description
     * The `reloadOnSearch` property has been set to false, and we are reusing the same
     * instance of the Controller.
     *
     * @param {Object} angularEvent Synthetic event object
     * @param {Route} current Current/previous route information.
     */

    var forceReload = false,
        preparedRoute,
        preparedRouteIsUpdateOnly,
        $route = {
          routes: routes,

          /**
           * @ngdoc method
           * @name $route#reload
           *
           * @description
           * Causes `$route` service to reload the current route even if
           * {@link ng.$location $location} hasn't changed.
           *
           * As a result of that, {@link ngRoute.directive:ngView ngView}
           * creates new scope and reinstantiates the controller.
           */
          reload: function() {
            forceReload = true;

            var fakeLocationEvent = {
              defaultPrevented: false,
              preventDefault: function fakePreventDefault() {
                this.defaultPrevented = true;
                forceReload = false;
              }
            };

            $rootScope.$evalAsync(function() {
              prepareRoute(fakeLocationEvent);
              if (!fakeLocationEvent.defaultPrevented) commitRoute();
            });
          },

          /**
           * @ngdoc method
           * @name $route#updateParams
           *
           * @description
           * Causes `$route` service to update the current URL, replacing
           * current route parameters with those specified in `newParams`.
           * Provided property names that match the route's path segment
           * definitions will be interpolated into the location's path, while
           * remaining properties will be treated as query params.
           *
           * @param {!Object<string, string>} newParams mapping of URL parameter names to values
           */
          updateParams: function(newParams) {
            if (this.current && this.current.$$route) {
              newParams = angular.extend({}, this.current.params, newParams);
              $location.path(interpolate(this.current.$$route.originalPath, newParams));
              // interpolate modifies newParams, only query params are left
              $location.search(newParams);
            } else {
              throw $routeMinErr('norout', 'Tried updating route when with no current route');
            }
          }
        };

    $rootScope.$on('$locationChangeStart', prepareRoute);
    $rootScope.$on('$locationChangeSuccess', commitRoute);

    return $route;

    /////////////////////////////////////////////////////

    /**
     * @param on {string} current url
     * @param route {Object} route regexp to match the url against
     * @return {?Object}
     *
     * @description
     * Check if the route matches the current url.
     *
     * Inspired by match in
     * visionmedia/express/lib/router/router.js.
     */
    function switchRouteMatcher(on, route) {
      var keys = route.keys,
          params = {};

      if (!route.regexp) return null;

      var m = route.regexp.exec(on);
      if (!m) return null;

      for (var i = 1, len = m.length; i < len; ++i) {
        var key = keys[i - 1];

        var val = m[i];

        if (key && val) {
          params[key.name] = val;
        }
      }
      return params;
    }

    function prepareRoute($locationEvent) {
      var lastRoute = $route.current;

      preparedRoute = parseRoute();
      preparedRouteIsUpdateOnly = preparedRoute && lastRoute && preparedRoute.$$route === lastRoute.$$route
          && angular.equals(preparedRoute.pathParams, lastRoute.pathParams)
          && !preparedRoute.reloadOnSearch && !forceReload;

      if (!preparedRouteIsUpdateOnly && (lastRoute || preparedRoute)) {
        if ($rootScope.$broadcast('$routeChangeStart', preparedRoute, lastRoute).defaultPrevented) {
          if ($locationEvent) {
            $locationEvent.preventDefault();
          }
        }
      }
    }

    function commitRoute() {
      var lastRoute = $route.current;
      var nextRoute = preparedRoute;

      if (preparedRouteIsUpdateOnly) {
        lastRoute.params = nextRoute.params;
        angular.copy(lastRoute.params, $routeParams);
        $rootScope.$broadcast('$routeUpdate', lastRoute);
      } else if (nextRoute || lastRoute) {
        forceReload = false;
        $route.current = nextRoute;

        var nextRoutePromise = $q.resolve(nextRoute);

        $browser.$$incOutstandingRequestCount();

        nextRoutePromise.
          then(getRedirectionData).
          then(handlePossibleRedirection).
          then(function(keepProcessingRoute) {
            return keepProcessingRoute && nextRoutePromise.
              then(resolveLocals).
              then(function(locals) {
                // after route change
                if (nextRoute === $route.current) {
                  if (nextRoute) {
                    nextRoute.locals = locals;
                    angular.copy(nextRoute.params, $routeParams);
                  }
                  $rootScope.$broadcast('$routeChangeSuccess', nextRoute, lastRoute);
                }
              });
          }).catch(function(error) {
            if (nextRoute === $route.current) {
              $rootScope.$broadcast('$routeChangeError', nextRoute, lastRoute, error);
            }
          }).finally(function() {
            // Because `commitRoute()` is called from a `$rootScope.$evalAsync` block (see
            // `$locationWatch`), this `$$completeOutstandingRequest()` call will not cause
            // `outstandingRequestCount` to hit zero.  This is important in case we are redirecting
            // to a new route which also requires some asynchronous work.

            $browser.$$completeOutstandingRequest(noop);
          });
      }
    }

    function getRedirectionData(route) {
      var data = {
        route: route,
        hasRedirection: false
      };

      if (route) {
        if (route.redirectTo) {
          if (angular.isString(route.redirectTo)) {
            data.path = interpolate(route.redirectTo, route.params);
            data.search = route.params;
            data.hasRedirection = true;
          } else {
            var oldPath = $location.path();
            var oldSearch = $location.search();
            var newUrl = route.redirectTo(route.pathParams, oldPath, oldSearch);

            if (angular.isDefined(newUrl)) {
              data.url = newUrl;
              data.hasRedirection = true;
            }
          }
        } else if (route.resolveRedirectTo) {
          return $q.
            resolve($injector.invoke(route.resolveRedirectTo)).
            then(function(newUrl) {
              if (angular.isDefined(newUrl)) {
                data.url = newUrl;
                data.hasRedirection = true;
              }

              return data;
            });
        }
      }

      return data;
    }

    function handlePossibleRedirection(data) {
      var keepProcessingRoute = true;

      if (data.route !== $route.current) {
        keepProcessingRoute = false;
      } else if (data.hasRedirection) {
        var oldUrl = $location.url();
        var newUrl = data.url;

        if (newUrl) {
          $location.
            url(newUrl).
            replace();
        } else {
          newUrl = $location.
            path(data.path).
            search(data.search).
            replace().
            url();
        }

        if (newUrl !== oldUrl) {
          // Exit out and don't process current next value,
          // wait for next location change from redirect
          keepProcessingRoute = false;
        }
      }

      return keepProcessingRoute;
    }

    function resolveLocals(route) {
      if (route) {
        var locals = angular.extend({}, route.resolve);
        angular.forEach(locals, function(value, key) {
          locals[key] = angular.isString(value) ?
              $injector.get(value) :
              $injector.invoke(value, null, null, key);
        });
        var template = getTemplateFor(route);
        if (angular.isDefined(template)) {
          locals['$template'] = template;
        }
        return $q.all(locals);
      }
    }

    function getTemplateFor(route) {
      var template, templateUrl;
      if (angular.isDefined(template = route.template)) {
        if (angular.isFunction(template)) {
          template = template(route.params);
        }
      } else if (angular.isDefined(templateUrl = route.templateUrl)) {
        if (angular.isFunction(templateUrl)) {
          templateUrl = templateUrl(route.params);
        }
        if (angular.isDefined(templateUrl)) {
          route.loadedTemplateUrl = $sce.valueOf(templateUrl);
          template = $templateRequest(templateUrl);
        }
      }
      return template;
    }

    /**
     * @returns {Object} the current active route, by matching it against the URL
     */
    function parseRoute() {
      // Match a route
      var params, match;
      angular.forEach(routes, function(route, path) {
        if (!match && (params = switchRouteMatcher($location.path(), route))) {
          match = inherit(route, {
            params: angular.extend({}, $location.search(), params),
            pathParams: params});
          match.$$route = route;
        }
      });
      // No route matched; fallback to "otherwise" route
      return match || routes[null] && inherit(routes[null], {params: {}, pathParams:{}});
    }

    /**
     * @returns {string} interpolation of the redirect path with the parameters
     */
    function interpolate(string, params) {
      var result = [];
      angular.forEach((string || '').split(':'), function(segment, i) {
        if (i === 0) {
          result.push(segment);
        } else {
          var segmentMatch = segment.match(/(\w+)(?:[?*])?(.*)/);
          var key = segmentMatch[1];
          result.push(params[key]);
          result.push(segmentMatch[2] || '');
          delete params[key];
        }
      });
      return result.join('');
    }
  }];
}

instantiateRoute.$inject = ['$injector'];
function instantiateRoute($injector) {
  if (isEagerInstantiationEnabled) {
    // Instantiate `$route`
    $injector.get('$route');
  }
}

ngRouteModule.provider('$routeParams', $RouteParamsProvider);


/**
 * @ngdoc service
 * @name $routeParams
 * @requires $route
 * @this
 *
 * @description
 * The `$routeParams` service allows you to retrieve the current set of route parameters.
 *
 * Requires the {@link ngRoute `ngRoute`} module to be installed.
 *
 * The route parameters are a combination of {@link ng.$location `$location`}'s
 * {@link ng.$location#search `search()`} and {@link ng.$location#path `path()`}.
 * The `path` parameters are extracted when the {@link ngRoute.$route `$route`} path is matched.
 *
 * In case of parameter name collision, `path` params take precedence over `search` params.
 *
 * The service guarantees that the identity of the `$routeParams` object will remain unchanged
 * (but its properties will likely change) even when a route change occurs.
 *
 * Note that the `$routeParams` are only updated *after* a route change completes successfully.
 * This means that you cannot rely on `$routeParams` being correct in route resolve functions.
 * Instead you can use `$route.current.params` to access the new route's parameters.
 *
 * @example
 * ```js
 *  // Given:
 *  // URL: http://server.com/index.html#/Chapter/1/Section/2?search=moby
 *  // Route: /Chapter/:chapterId/Section/:sectionId
 *  //
 *  // Then
 *  $routeParams ==> {chapterId:'1', sectionId:'2', search:'moby'}
 * ```
 */
function $RouteParamsProvider() {
  this.$get = function() { return {}; };
}

ngRouteModule.directive('ngView', ngViewFactory);
ngRouteModule.directive('ngView', ngViewFillContentFactory);


/**
 * @ngdoc directive
 * @name ngView
 * @restrict ECA
 *
 * @description
 * # Overview
 * `ngView` is a directive that complements the {@link ngRoute.$route $route} service by
 * including the rendered template of the current route into the main layout (`index.html`) file.
 * Every time the current route changes, the included view changes with it according to the
 * configuration of the `$route` service.
 *
 * Requires the {@link ngRoute `ngRoute`} module to be installed.
 *
 * @animations
 * | Animation                        | Occurs                              |
 * |----------------------------------|-------------------------------------|
 * | {@link ng.$animate#enter enter}  | when the new element is inserted to the DOM |
 * | {@link ng.$animate#leave leave}  | when the old element is removed from to the DOM  |
 *
 * The enter and leave animation occur concurrently.
 *
 * @scope
 * @priority 400
 * @param {string=} onload Expression to evaluate whenever the view updates.
 *
 * @param {string=} autoscroll Whether `ngView` should call {@link ng.$anchorScroll
 *                  $anchorScroll} to scroll the viewport after the view is updated.
 *
 *                  - If the attribute is not set, disable scrolling.
 *                  - If the attribute is set without value, enable scrolling.
 *                  - Otherwise enable scrolling only if the `autoscroll` attribute value evaluated
 *                    as an expression yields a truthy value.
 * @example
    <example name="ngView-directive" module="ngViewExample"
             deps="angular-route.js;angular-animate.js"
             animations="true" fixBase="true">
      <file name="index.html">
        <div ng-controller="MainCtrl as main">
          Choose:
          <a href="Book/Moby">Moby</a> |
          <a href="Book/Moby/ch/1">Moby: Ch1</a> |
          <a href="Book/Gatsby">Gatsby</a> |
          <a href="Book/Gatsby/ch/4?key=value">Gatsby: Ch4</a> |
          <a href="Book/Scarlet">Scarlet Letter</a><br/>

          <div class="view-animate-container">
            <div ng-view class="view-animate"></div>
          </div>
          <hr />

          <pre>$location.path() = {{main.$location.path()}}</pre>
          <pre>$route.current.templateUrl = {{main.$route.current.templateUrl}}</pre>
          <pre>$route.current.params = {{main.$route.current.params}}</pre>
          <pre>$routeParams = {{main.$routeParams}}</pre>
        </div>
      </file>

      <file name="book.html">
        <div>
          controller: {{book.name}}<br />
          Book Id: {{book.params.bookId}}<br />
        </div>
      </file>

      <file name="chapter.html">
        <div>
          controller: {{chapter.name}}<br />
          Book Id: {{chapter.params.bookId}}<br />
          Chapter Id: {{chapter.params.chapterId}}
        </div>
      </file>

      <file name="animations.css">
        .view-animate-container {
          position:relative;
          height:100px!important;
          background:white;
          border:1px solid black;
          height:40px;
          overflow:hidden;
        }

        .view-animate {
          padding:10px;
        }

        .view-animate.ng-enter, .view-animate.ng-leave {
          transition:all cubic-bezier(0.250, 0.460, 0.450, 0.940) 1.5s;

          display:block;
          width:100%;
          border-left:1px solid black;

          position:absolute;
          top:0;
          left:0;
          right:0;
          bottom:0;
          padding:10px;
        }

        .view-animate.ng-enter {
          left:100%;
        }
        .view-animate.ng-enter.ng-enter-active {
          left:0;
        }
        .view-animate.ng-leave.ng-leave-active {
          left:-100%;
        }
      </file>

      <file name="script.js">
        angular.module('ngViewExample', ['ngRoute', 'ngAnimate'])
          .config(['$routeProvider', '$locationProvider',
            function($routeProvider, $locationProvider) {
              $routeProvider
                .when('/Book/:bookId', {
                  templateUrl: 'book.html',
                  controller: 'BookCtrl',
                  controllerAs: 'book'
                })
                .when('/Book/:bookId/ch/:chapterId', {
                  templateUrl: 'chapter.html',
                  controller: 'ChapterCtrl',
                  controllerAs: 'chapter'
                });

              $locationProvider.html5Mode(true);
          }])
          .controller('MainCtrl', ['$route', '$routeParams', '$location',
            function MainCtrl($route, $routeParams, $location) {
              this.$route = $route;
              this.$location = $location;
              this.$routeParams = $routeParams;
          }])
          .controller('BookCtrl', ['$routeParams', function BookCtrl($routeParams) {
            this.name = 'BookCtrl';
            this.params = $routeParams;
          }])
          .controller('ChapterCtrl', ['$routeParams', function ChapterCtrl($routeParams) {
            this.name = 'ChapterCtrl';
            this.params = $routeParams;
          }]);

      </file>

      <file name="protractor.js" type="protractor">
        it('should load and compile correct template', function() {
          element(by.linkText('Moby: Ch1')).click();
          var content = element(by.css('[ng-view]')).getText();
          expect(content).toMatch(/controller: ChapterCtrl/);
          expect(content).toMatch(/Book Id: Moby/);
          expect(content).toMatch(/Chapter Id: 1/);

          element(by.partialLinkText('Scarlet')).click();

          content = element(by.css('[ng-view]')).getText();
          expect(content).toMatch(/controller: BookCtrl/);
          expect(content).toMatch(/Book Id: Scarlet/);
        });
      </file>
    </example>
 */


/**
 * @ngdoc event
 * @name ngView#$viewContentLoaded
 * @eventType emit on the current ngView scope
 * @description
 * Emitted every time the ngView content is reloaded.
 */
ngViewFactory.$inject = ['$route', '$anchorScroll', '$animate'];
function ngViewFactory($route, $anchorScroll, $animate) {
  return {
    restrict: 'ECA',
    terminal: true,
    priority: 400,
    transclude: 'element',
    link: function(scope, $element, attr, ctrl, $transclude) {
        var currentScope,
            currentElement,
            previousLeaveAnimation,
            autoScrollExp = attr.autoscroll,
            onloadExp = attr.onload || '';

        scope.$on('$routeChangeSuccess', update);
        update();

        function cleanupLastView() {
          if (previousLeaveAnimation) {
            $animate.cancel(previousLeaveAnimation);
            previousLeaveAnimation = null;
          }

          if (currentScope) {
            currentScope.$destroy();
            currentScope = null;
          }
          if (currentElement) {
            previousLeaveAnimation = $animate.leave(currentElement);
            previousLeaveAnimation.done(function(response) {
              if (response !== false) previousLeaveAnimation = null;
            });
            currentElement = null;
          }
        }

        function update() {
          var locals = $route.current && $route.current.locals,
              template = locals && locals.$template;

          if (angular.isDefined(template)) {
            var newScope = scope.$new();
            var current = $route.current;

            // Note: This will also link all children of ng-view that were contained in the original
            // html. If that content contains controllers, ... they could pollute/change the scope.
            // However, using ng-view on an element with additional content does not make sense...
            // Note: We can't remove them in the cloneAttchFn of $transclude as that
            // function is called before linking the content, which would apply child
            // directives to non existing elements.
            var clone = $transclude(newScope, function(clone) {
              $animate.enter(clone, null, currentElement || $element).done(function onNgViewEnter(response) {
                if (response !== false && angular.isDefined(autoScrollExp)
                  && (!autoScrollExp || scope.$eval(autoScrollExp))) {
                  $anchorScroll();
                }
              });
              cleanupLastView();
            });

            currentElement = clone;
            currentScope = current.scope = newScope;
            currentScope.$emit('$viewContentLoaded');
            currentScope.$eval(onloadExp);
          } else {
            cleanupLastView();
          }
        }
    }
  };
}

// This directive is called during the $transclude call of the first `ngView` directive.
// It will replace and compile the content of the element with the loaded template.
// We need this directive so that the element content is already filled when
// the link function of another directive on the same element as ngView
// is called.
ngViewFillContentFactory.$inject = ['$compile', '$controller', '$route'];
function ngViewFillContentFactory($compile, $controller, $route) {
  return {
    restrict: 'ECA',
    priority: -400,
    link: function(scope, $element) {
      var current = $route.current,
          locals = current.locals;

      $element.html(locals.$template);

      var link = $compile($element.contents());

      if (current.controller) {
        locals.$scope = scope;
        var controller = $controller(current.controller, locals);
        if (current.controllerAs) {
          scope[current.controllerAs] = controller;
        }
        $element.data('$ngControllerController', controller);
        $element.children().data('$ngControllerController', controller);
      }
      scope[current.resolveAs || '$resolve'] = locals;

      link(scope);
    }
  };
}


})(window, window.angular);

/**
 * angular-routes-provider
 * @version v0.0.1
 * @link https://github.com/sidigdoyo/angular-routes-provider
 * @license MIT
 * @author Sidigdoyo Pribadi <sidigdoyo@gmail.com>
 */
 
(function(window, angular, undefined) {
	"use strict";
	var options = {
		routes: {},
		debug: false
	};


	var $routesProvider = function($stateProvider, $urlRouterProvider) {
		var self = this;

		var registerViews = function(view) {
			var result = {};

			angular.forEach(view, function(value, key) {

				var controllerProvider = function() {
					return value.controller;
				};
				controllerProvider.$inject = [];
				
				var templateProvider = function($templateCache) {
					return $templateCache.get(value.template);
				}
				templateProvider.$inject = ["$templateCache"];

				result[key] = {
					controllerProvider: controllerProvider,
					templateProvider: templateProvider
				};
			});
			return result;
		};


		var registerState = function(routes, url, name) {
			var stateConfig = {
				url: '/' + url
			};

			if(routes.params) {
				var params = {};
				angular.forEach(routes.params, function(value, key) {
					stateConfig.url += "/:" + key ;
					params[key] = {
						"value": value
					};

					if(params[key].value === null) {
						params[key].squash = true;
					}
				});

				stateConfig.params = params;
			}

			if(routes.abstract) {
				stateConfig.abstract = routes.abstract;
			}

			if(routes.views) {
				stateConfig.views = registerViews(routes.views);
			}

			$stateProvider.state(name, stateConfig);

			if(routes.default) {
				var state = function($state) {
					$state.go(name);
				};
				state.$inject = ["$state"];

				$urlRouterProvider.otherwise(function($injector){
					$injector.invoke( state );
				});
			}

			if(routes.child) {
				angular.forEach(routes.child, function(child, key) {
					registerState(child, key, name + "." + key);
				});
			}
		};


		var $routes = function($injector, $templateCache) {
			return {
				start: function() {

					angular.forEach(options.routes, function(value, key) {
						registerState(value, key, key);
					});

				}
			};
		};
		$routes.$inject = ['$injector', '$templateCache'];

		self.$get = $routes;

		self.config = function(opt) {
			angular.forEach(opt, function(value, key) {
				options[key] = opt[key];
			});
		};
		
	};

	$routesProvider.$inject = ['$stateProvider', '$urlRouterProvider'];

	angular.module("routes.provider", ["ui.router"])
		.provider("$routes", $routesProvider);

})(window, window.angular);

/**
 * @license AngularJS v1.6.5
 * (c) 2010-2017 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular) {'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *     Any commits to this file should be reviewed with security in mind.  *
 *   Changes to this file can potentially create security vulnerabilities. *
 *          An approval from 2 Core members with history of modifying      *
 *                         this file is required.                          *
 *                                                                         *
 *  Does the change somehow allow for arbitrary javascript to be executed? *
 *    Or allows for someone to change the prototype of built-in objects?   *
 *     Or gives undesired access to variables likes document or window?    *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var $sanitizeMinErr = angular.$$minErr('$sanitize');
var bind;
var extend;
var forEach;
var isDefined;
var lowercase;
var noop;
var nodeContains;
var htmlParser;
var htmlSanitizeWriter;

/**
 * @ngdoc module
 * @name ngSanitize
 * @description
 *
 * # ngSanitize
 *
 * The `ngSanitize` module provides functionality to sanitize HTML.
 *
 *
 * <div doc-module-components="ngSanitize"></div>
 *
 * See {@link ngSanitize.$sanitize `$sanitize`} for usage.
 */

/**
 * @ngdoc service
 * @name $sanitize
 * @kind function
 *
 * @description
 *   Sanitizes an html string by stripping all potentially dangerous tokens.
 *
 *   The input is sanitized by parsing the HTML into tokens. All safe tokens (from a whitelist) are
 *   then serialized back to properly escaped html string. This means that no unsafe input can make
 *   it into the returned string.
 *
 *   The whitelist for URL sanitization of attribute values is configured using the functions
 *   `aHrefSanitizationWhitelist` and `imgSrcSanitizationWhitelist` of {@link ng.$compileProvider
 *   `$compileProvider`}.
 *
 *   The input may also contain SVG markup if this is enabled via {@link $sanitizeProvider}.
 *
 * @param {string} html HTML input.
 * @returns {string} Sanitized HTML.
 *
 * @example
   <example module="sanitizeExample" deps="angular-sanitize.js" name="sanitize-service">
   <file name="index.html">
     <script>
         angular.module('sanitizeExample', ['ngSanitize'])
           .controller('ExampleController', ['$scope', '$sce', function($scope, $sce) {
             $scope.snippet =
               '<p style="color:blue">an html\n' +
               '<em onmouseover="this.textContent=\'PWN3D!\'">click here</em>\n' +
               'snippet</p>';
             $scope.deliberatelyTrustDangerousSnippet = function() {
               return $sce.trustAsHtml($scope.snippet);
             };
           }]);
     </script>
     <div ng-controller="ExampleController">
        Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <td>Directive</td>
           <td>How</td>
           <td>Source</td>
           <td>Rendered</td>
         </tr>
         <tr id="bind-html-with-sanitize">
           <td>ng-bind-html</td>
           <td>Automatically uses $sanitize</td>
           <td><pre>&lt;div ng-bind-html="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind-html="snippet"></div></td>
         </tr>
         <tr id="bind-html-with-trust">
           <td>ng-bind-html</td>
           <td>Bypass $sanitize by explicitly trusting the dangerous value</td>
           <td>
           <pre>&lt;div ng-bind-html="deliberatelyTrustDangerousSnippet()"&gt;
&lt;/div&gt;</pre>
           </td>
           <td><div ng-bind-html="deliberatelyTrustDangerousSnippet()"></div></td>
         </tr>
         <tr id="bind-default">
           <td>ng-bind</td>
           <td>Automatically escapes</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br/>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
       </div>
   </file>
   <file name="protractor.js" type="protractor">
     it('should sanitize the html snippet by default', function() {
       expect(element(by.css('#bind-html-with-sanitize div')).getAttribute('innerHTML')).
         toBe('<p>an html\n<em>click here</em>\nsnippet</p>');
     });

     it('should inline raw snippet if bound to a trusted value', function() {
       expect(element(by.css('#bind-html-with-trust div')).getAttribute('innerHTML')).
         toBe("<p style=\"color:blue\">an html\n" +
              "<em onmouseover=\"this.textContent='PWN3D!'\">click here</em>\n" +
              "snippet</p>");
     });

     it('should escape snippet without any filter', function() {
       expect(element(by.css('#bind-default div')).getAttribute('innerHTML')).
         toBe("&lt;p style=\"color:blue\"&gt;an html\n" +
              "&lt;em onmouseover=\"this.textContent='PWN3D!'\"&gt;click here&lt;/em&gt;\n" +
              "snippet&lt;/p&gt;");
     });

     it('should update', function() {
       element(by.model('snippet')).clear();
       element(by.model('snippet')).sendKeys('new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-html-with-sanitize div')).getAttribute('innerHTML')).
         toBe('new <b>text</b>');
       expect(element(by.css('#bind-html-with-trust div')).getAttribute('innerHTML')).toBe(
         'new <b onclick="alert(1)">text</b>');
       expect(element(by.css('#bind-default div')).getAttribute('innerHTML')).toBe(
         "new &lt;b onclick=\"alert(1)\"&gt;text&lt;/b&gt;");
     });
   </file>
   </example>
 */


/**
 * @ngdoc provider
 * @name $sanitizeProvider
 * @this
 *
 * @description
 * Creates and configures {@link $sanitize} instance.
 */
function $SanitizeProvider() {
  var svgEnabled = false;

  this.$get = ['$$sanitizeUri', function($$sanitizeUri) {
    if (svgEnabled) {
      extend(validElements, svgElements);
    }
    return function(html) {
      var buf = [];
      htmlParser(html, htmlSanitizeWriter(buf, function(uri, isImage) {
        return !/^unsafe:/.test($$sanitizeUri(uri, isImage));
      }));
      return buf.join('');
    };
  }];


  /**
   * @ngdoc method
   * @name $sanitizeProvider#enableSvg
   * @kind function
   *
   * @description
   * Enables a subset of svg to be supported by the sanitizer.
   *
   * <div class="alert alert-warning">
   *   <p>By enabling this setting without taking other precautions, you might expose your
   *   application to click-hijacking attacks. In these attacks, sanitized svg elements could be positioned
   *   outside of the containing element and be rendered over other elements on the page (e.g. a login
   *   link). Such behavior can then result in phishing incidents.</p>
   *
   *   <p>To protect against these, explicitly setup `overflow: hidden` css rule for all potential svg
   *   tags within the sanitized content:</p>
   *
   *   <br>
   *
   *   <pre><code>
   *   .rootOfTheIncludedContent svg {
   *     overflow: hidden !important;
   *   }
   *   </code></pre>
   * </div>
   *
   * @param {boolean=} flag Enable or disable SVG support in the sanitizer.
   * @returns {boolean|ng.$sanitizeProvider} Returns the currently configured value if called
   *    without an argument or self for chaining otherwise.
   */
  this.enableSvg = function(enableSvg) {
    if (isDefined(enableSvg)) {
      svgEnabled = enableSvg;
      return this;
    } else {
      return svgEnabled;
    }
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////
  // Private stuff
  //////////////////////////////////////////////////////////////////////////////////////////////////

  bind = angular.bind;
  extend = angular.extend;
  forEach = angular.forEach;
  isDefined = angular.isDefined;
  lowercase = angular.lowercase;
  noop = angular.noop;

  htmlParser = htmlParserImpl;
  htmlSanitizeWriter = htmlSanitizeWriterImpl;

  nodeContains = window.Node.prototype.contains || /** @this */ function(arg) {
    // eslint-disable-next-line no-bitwise
    return !!(this.compareDocumentPosition(arg) & 16);
  };

  // Regular Expressions for parsing tags and attributes
  var SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
    // Match everything outside of normal chars and " (quote character)
    NON_ALPHANUMERIC_REGEXP = /([^#-~ |!])/g;


  // Good source of info about elements and attributes
  // http://dev.w3.org/html5/spec/Overview.html#semantics
  // http://simon.html5.org/html-elements

  // Safe Void Elements - HTML5
  // http://dev.w3.org/html5/spec/Overview.html#void-elements
  var voidElements = toMap('area,br,col,hr,img,wbr');

  // Elements that you can, intentionally, leave open (and which close themselves)
  // http://dev.w3.org/html5/spec/Overview.html#optional-tags
  var optionalEndTagBlockElements = toMap('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr'),
      optionalEndTagInlineElements = toMap('rp,rt'),
      optionalEndTagElements = extend({},
                                              optionalEndTagInlineElements,
                                              optionalEndTagBlockElements);

  // Safe Block Elements - HTML5
  var blockElements = extend({}, optionalEndTagBlockElements, toMap('address,article,' +
          'aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' +
          'h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,section,table,ul'));

  // Inline Elements - HTML5
  var inlineElements = extend({}, optionalEndTagInlineElements, toMap('a,abbr,acronym,b,' +
          'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s,' +
          'samp,small,span,strike,strong,sub,sup,time,tt,u,var'));

  // SVG Elements
  // https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Elements
  // Note: the elements animate,animateColor,animateMotion,animateTransform,set are intentionally omitted.
  // They can potentially allow for arbitrary javascript to be executed. See #11290
  var svgElements = toMap('circle,defs,desc,ellipse,font-face,font-face-name,font-face-src,g,glyph,' +
          'hkern,image,linearGradient,line,marker,metadata,missing-glyph,mpath,path,polygon,polyline,' +
          'radialGradient,rect,stop,svg,switch,text,title,tspan');

  // Blocked Elements (will be stripped)
  var blockedElements = toMap('script,style');

  var validElements = extend({},
                                     voidElements,
                                     blockElements,
                                     inlineElements,
                                     optionalEndTagElements);

  //Attributes that have href and hence need to be sanitized
  var uriAttrs = toMap('background,cite,href,longdesc,src,xlink:href');

  var htmlAttrs = toMap('abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' +
      'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,' +
      'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,' +
      'scope,scrolling,shape,size,span,start,summary,tabindex,target,title,type,' +
      'valign,value,vspace,width');

  // SVG attributes (without "id" and "name" attributes)
  // https://wiki.whatwg.org/wiki/Sanitization_rules#svg_Attributes
  var svgAttrs = toMap('accent-height,accumulate,additive,alphabetic,arabic-form,ascent,' +
      'baseProfile,bbox,begin,by,calcMode,cap-height,class,color,color-rendering,content,' +
      'cx,cy,d,dx,dy,descent,display,dur,end,fill,fill-rule,font-family,font-size,font-stretch,' +
      'font-style,font-variant,font-weight,from,fx,fy,g1,g2,glyph-name,gradientUnits,hanging,' +
      'height,horiz-adv-x,horiz-origin-x,ideographic,k,keyPoints,keySplines,keyTimes,lang,' +
      'marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mathematical,' +
      'max,min,offset,opacity,orient,origin,overline-position,overline-thickness,panose-1,' +
      'path,pathLength,points,preserveAspectRatio,r,refX,refY,repeatCount,repeatDur,' +
      'requiredExtensions,requiredFeatures,restart,rotate,rx,ry,slope,stemh,stemv,stop-color,' +
      'stop-opacity,strikethrough-position,strikethrough-thickness,stroke,stroke-dasharray,' +
      'stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,' +
      'stroke-width,systemLanguage,target,text-anchor,to,transform,type,u1,u2,underline-position,' +
      'underline-thickness,unicode,unicode-range,units-per-em,values,version,viewBox,visibility,' +
      'width,widths,x,x-height,x1,x2,xlink:actuate,xlink:arcrole,xlink:role,xlink:show,xlink:title,' +
      'xlink:type,xml:base,xml:lang,xml:space,xmlns,xmlns:xlink,y,y1,y2,zoomAndPan', true);

  var validAttrs = extend({},
                                  uriAttrs,
                                  svgAttrs,
                                  htmlAttrs);

  function toMap(str, lowercaseKeys) {
    var obj = {}, items = str.split(','), i;
    for (i = 0; i < items.length; i++) {
      obj[lowercaseKeys ? lowercase(items[i]) : items[i]] = true;
    }
    return obj;
  }

  /**
   * Create an inert document that contains the dirty HTML that needs sanitizing
   * Depending upon browser support we use one of three strategies for doing this.
   * Support: Safari 10.x -> XHR strategy
   * Support: Firefox -> DomParser strategy
   */
  var getInertBodyElement /* function(html: string): HTMLBodyElement */ = (function(window, document) {
    var inertDocument;
    if (document && document.implementation) {
      inertDocument = document.implementation.createHTMLDocument('inert');
    } else {
      throw $sanitizeMinErr('noinert', 'Can\'t create an inert html document');
    }
    var inertBodyElement = (inertDocument.documentElement || inertDocument.getDocumentElement()).querySelector('body');

    // Check for the Safari 10.1 bug - which allows JS to run inside the SVG G element
    inertBodyElement.innerHTML = '<svg><g onload="this.parentNode.remove()"></g></svg>';
    if (!inertBodyElement.querySelector('svg')) {
      return getInertBodyElement_XHR;
    } else {
      // Check for the Firefox bug - which prevents the inner img JS from being sanitized
      inertBodyElement.innerHTML = '<svg><p><style><img src="</style><img src=x onerror=alert(1)//">';
      if (inertBodyElement.querySelector('svg img')) {
        return getInertBodyElement_DOMParser;
      } else {
        return getInertBodyElement_InertDocument;
      }
    }

    function getInertBodyElement_XHR(html) {
      // We add this dummy element to ensure that the rest of the content is parsed as expected
      // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the `<head>` tag.
      html = '<remove></remove>' + html;
      try {
        html = encodeURI(html);
      } catch (e) {
        return undefined;
      }
      var xhr = new window.XMLHttpRequest();
      xhr.responseType = 'document';
      xhr.open('GET', 'data:text/html;charset=utf-8,' + html, false);
      xhr.send(null);
      var body = xhr.response.body;
      body.firstChild.remove();
      return body;
    }

    function getInertBodyElement_DOMParser(html) {
      // We add this dummy element to ensure that the rest of the content is parsed as expected
      // e.g. leading whitespace is maintained and tags like `<meta>` do not get hoisted to the `<head>` tag.
      html = '<remove></remove>' + html;
      try {
        var body = new window.DOMParser().parseFromString(html, 'text/html').body;
        body.firstChild.remove();
        return body;
      } catch (e) {
        return undefined;
      }
    }

    function getInertBodyElement_InertDocument(html) {
      inertBodyElement.innerHTML = html;

      // Support: IE 9-11 only
      // strip custom-namespaced attributes on IE<=11
      if (document.documentMode) {
        stripCustomNsAttrs(inertBodyElement);
      }

      return inertBodyElement;
    }
  })(window, window.document);

  /**
   * @example
   * htmlParser(htmlString, {
   *     start: function(tag, attrs) {},
   *     end: function(tag) {},
   *     chars: function(text) {},
   *     comment: function(text) {}
   * });
   *
   * @param {string} html string
   * @param {object} handler
   */
  function htmlParserImpl(html, handler) {
    if (html === null || html === undefined) {
      html = '';
    } else if (typeof html !== 'string') {
      html = '' + html;
    }

    var inertBodyElement = getInertBodyElement(html);
    if (!inertBodyElement) return '';

    //mXSS protection
    var mXSSAttempts = 5;
    do {
      if (mXSSAttempts === 0) {
        throw $sanitizeMinErr('uinput', 'Failed to sanitize html because the input is unstable');
      }
      mXSSAttempts--;

      // trigger mXSS if it is going to happen by reading and writing the innerHTML
      html = inertBodyElement.innerHTML;
      inertBodyElement = getInertBodyElement(html);
    } while (html !== inertBodyElement.innerHTML);

    var node = inertBodyElement.firstChild;
    while (node) {
      switch (node.nodeType) {
        case 1: // ELEMENT_NODE
          handler.start(node.nodeName.toLowerCase(), attrToMap(node.attributes));
          break;
        case 3: // TEXT NODE
          handler.chars(node.textContent);
          break;
      }

      var nextNode;
      if (!(nextNode = node.firstChild)) {
        if (node.nodeType === 1) {
          handler.end(node.nodeName.toLowerCase());
        }
        nextNode = getNonDescendant('nextSibling', node);
        if (!nextNode) {
          while (nextNode == null) {
            node = getNonDescendant('parentNode', node);
            if (node === inertBodyElement) break;
            nextNode = getNonDescendant('nextSibling', node);
            if (node.nodeType === 1) {
              handler.end(node.nodeName.toLowerCase());
            }
          }
        }
      }
      node = nextNode;
    }

    while ((node = inertBodyElement.firstChild)) {
      inertBodyElement.removeChild(node);
    }
  }

  function attrToMap(attrs) {
    var map = {};
    for (var i = 0, ii = attrs.length; i < ii; i++) {
      var attr = attrs[i];
      map[attr.name] = attr.value;
    }
    return map;
  }


  /**
   * Escapes all potentially dangerous characters, so that the
   * resulting string can be safely inserted into attribute or
   * element text.
   * @param value
   * @returns {string} escaped text
   */
  function encodeEntities(value) {
    return value.
      replace(/&/g, '&amp;').
      replace(SURROGATE_PAIR_REGEXP, function(value) {
        var hi = value.charCodeAt(0);
        var low = value.charCodeAt(1);
        return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
      }).
      replace(NON_ALPHANUMERIC_REGEXP, function(value) {
        return '&#' + value.charCodeAt(0) + ';';
      }).
      replace(/</g, '&lt;').
      replace(/>/g, '&gt;');
  }

  /**
   * create an HTML/XML writer which writes to buffer
   * @param {Array} buf use buf.join('') to get out sanitized html string
   * @returns {object} in the form of {
   *     start: function(tag, attrs) {},
   *     end: function(tag) {},
   *     chars: function(text) {},
   *     comment: function(text) {}
   * }
   */
  function htmlSanitizeWriterImpl(buf, uriValidator) {
    var ignoreCurrentElement = false;
    var out = bind(buf, buf.push);
    return {
      start: function(tag, attrs) {
        tag = lowercase(tag);
        if (!ignoreCurrentElement && blockedElements[tag]) {
          ignoreCurrentElement = tag;
        }
        if (!ignoreCurrentElement && validElements[tag] === true) {
          out('<');
          out(tag);
          forEach(attrs, function(value, key) {
            var lkey = lowercase(key);
            var isImage = (tag === 'img' && lkey === 'src') || (lkey === 'background');
            if (validAttrs[lkey] === true &&
              (uriAttrs[lkey] !== true || uriValidator(value, isImage))) {
              out(' ');
              out(key);
              out('="');
              out(encodeEntities(value));
              out('"');
            }
          });
          out('>');
        }
      },
      end: function(tag) {
        tag = lowercase(tag);
        if (!ignoreCurrentElement && validElements[tag] === true && voidElements[tag] !== true) {
          out('</');
          out(tag);
          out('>');
        }
        // eslint-disable-next-line eqeqeq
        if (tag == ignoreCurrentElement) {
          ignoreCurrentElement = false;
        }
      },
      chars: function(chars) {
        if (!ignoreCurrentElement) {
          out(encodeEntities(chars));
        }
      }
    };
  }


  /**
   * When IE9-11 comes across an unknown namespaced attribute e.g. 'xlink:foo' it adds 'xmlns:ns1' attribute to declare
   * ns1 namespace and prefixes the attribute with 'ns1' (e.g. 'ns1:xlink:foo'). This is undesirable since we don't want
   * to allow any of these custom attributes. This method strips them all.
   *
   * @param node Root element to process
   */
  function stripCustomNsAttrs(node) {
    while (node) {
      if (node.nodeType === window.Node.ELEMENT_NODE) {
        var attrs = node.attributes;
        for (var i = 0, l = attrs.length; i < l; i++) {
          var attrNode = attrs[i];
          var attrName = attrNode.name.toLowerCase();
          if (attrName === 'xmlns:ns1' || attrName.lastIndexOf('ns1:', 0) === 0) {
            node.removeAttributeNode(attrNode);
            i--;
            l--;
          }
        }
      }

      var nextNode = node.firstChild;
      if (nextNode) {
        stripCustomNsAttrs(nextNode);
      }

      node = getNonDescendant('nextSibling', node);
    }
  }

  function getNonDescendant(propName, node) {
    // An element is clobbered if its `propName` property points to one of its descendants
    var nextNode = node[propName];
    if (nextNode && nodeContains.call(node, nextNode)) {
      throw $sanitizeMinErr('elclob', 'Failed to sanitize html because the element is clobbered: {0}', node.outerHTML || node.outerText);
    }
    return nextNode;
  }
}

function sanitizeText(chars) {
  var buf = [];
  var writer = htmlSanitizeWriter(buf, noop);
  writer.chars(chars);
  return buf.join('');
}


// define ngSanitize module and register $sanitize service
angular.module('ngSanitize', [])
  .provider('$sanitize', $SanitizeProvider)
  .info({ angularVersion: '1.6.5' });

/**
 * @ngdoc filter
 * @name linky
 * @kind function
 *
 * @description
 * Finds links in text input and turns them into html links. Supports `http/https/ftp/mailto` and
 * plain email address links.
 *
 * Requires the {@link ngSanitize `ngSanitize`} module to be installed.
 *
 * @param {string} text Input text.
 * @param {string} target Window (`_blank|_self|_parent|_top`) or named frame to open links in.
 * @param {object|function(url)} [attributes] Add custom attributes to the link element.
 *
 *    Can be one of:
 *
 *    - `object`: A map of attributes
 *    - `function`: Takes the url as a parameter and returns a map of attributes
 *
 *    If the map of attributes contains a value for `target`, it overrides the value of
 *    the target parameter.
 *
 *
 * @returns {string} Html-linkified and {@link $sanitize sanitized} text.
 *
 * @usage
   <span ng-bind-html="linky_expression | linky"></span>
 *
 * @example
   <example module="linkyExample" deps="angular-sanitize.js" name="linky-filter">
     <file name="index.html">
       <div ng-controller="ExampleController">
       Snippet: <textarea ng-model="snippet" cols="60" rows="3"></textarea>
       <table>
         <tr>
           <th>Filter</th>
           <th>Source</th>
           <th>Rendered</th>
         </tr>
         <tr id="linky-filter">
           <td>linky filter</td>
           <td>
             <pre>&lt;div ng-bind-html="snippet | linky"&gt;<br>&lt;/div&gt;</pre>
           </td>
           <td>
             <div ng-bind-html="snippet | linky"></div>
           </td>
         </tr>
         <tr id="linky-target">
          <td>linky target</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithSingleURL | linky:'_blank'"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithSingleURL | linky:'_blank'"></div>
          </td>
         </tr>
         <tr id="linky-custom-attributes">
          <td>linky custom attributes</td>
          <td>
            <pre>&lt;div ng-bind-html="snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}"&gt;<br>&lt;/div&gt;</pre>
          </td>
          <td>
            <div ng-bind-html="snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}"></div>
          </td>
         </tr>
         <tr id="escaped-html">
           <td>no filter</td>
           <td><pre>&lt;div ng-bind="snippet"&gt;<br>&lt;/div&gt;</pre></td>
           <td><div ng-bind="snippet"></div></td>
         </tr>
       </table>
     </file>
     <file name="script.js">
       angular.module('linkyExample', ['ngSanitize'])
         .controller('ExampleController', ['$scope', function($scope) {
           $scope.snippet =
             'Pretty text with some links:\n' +
             'http://angularjs.org/,\n' +
             'mailto:us@somewhere.org,\n' +
             'another@somewhere.org,\n' +
             'and one more: ftp://127.0.0.1/.';
           $scope.snippetWithSingleURL = 'http://angularjs.org/';
         }]);
     </file>
     <file name="protractor.js" type="protractor">
       it('should linkify the snippet with urls', function() {
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(4);
       });

       it('should not linkify snippet without the linky filter', function() {
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText()).
             toBe('Pretty text with some links: http://angularjs.org/, mailto:us@somewhere.org, ' +
                  'another@somewhere.org, and one more: ftp://127.0.0.1/.');
         expect(element.all(by.css('#escaped-html a')).count()).toEqual(0);
       });

       it('should update', function() {
         element(by.model('snippet')).clear();
         element(by.model('snippet')).sendKeys('new http://link.');
         expect(element(by.id('linky-filter')).element(by.binding('snippet | linky')).getText()).
             toBe('new http://link.');
         expect(element.all(by.css('#linky-filter a')).count()).toEqual(1);
         expect(element(by.id('escaped-html')).element(by.binding('snippet')).getText())
             .toBe('new http://link.');
       });

       it('should work with the target property', function() {
        expect(element(by.id('linky-target')).
            element(by.binding("snippetWithSingleURL | linky:'_blank'")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-target a')).getAttribute('target')).toEqual('_blank');
       });

       it('should optionally add custom attributes', function() {
        expect(element(by.id('linky-custom-attributes')).
            element(by.binding("snippetWithSingleURL | linky:'_self':{rel: 'nofollow'}")).getText()).
            toBe('http://angularjs.org/');
        expect(element(by.css('#linky-custom-attributes a')).getAttribute('rel')).toEqual('nofollow');
       });
     </file>
   </example>
 */
angular.module('ngSanitize').filter('linky', ['$sanitize', function($sanitize) {
  var LINKY_URL_REGEXP =
        /((ftp|https?):\/\/|(www\.)|(mailto:)?[A-Za-z0-9._%+-]+@)\S*[^\s.;,(){}<>"\u201d\u2019]/i,
      MAILTO_REGEXP = /^mailto:/i;

  var linkyMinErr = angular.$$minErr('linky');
  var isDefined = angular.isDefined;
  var isFunction = angular.isFunction;
  var isObject = angular.isObject;
  var isString = angular.isString;

  return function(text, target, attributes) {
    if (text == null || text === '') return text;
    if (!isString(text)) throw linkyMinErr('notstring', 'Expected string but received: {0}', text);

    var attributesFn =
      isFunction(attributes) ? attributes :
      isObject(attributes) ? function getAttributesObject() {return attributes;} :
      function getEmptyAttributesObject() {return {};};

    var match;
    var raw = text;
    var html = [];
    var url;
    var i;
    while ((match = raw.match(LINKY_URL_REGEXP))) {
      // We can not end in these as they are sometimes found at the end of the sentence
      url = match[0];
      // if we did not match ftp/http/www/mailto then assume mailto
      if (!match[2] && !match[4]) {
        url = (match[3] ? 'http://' : 'mailto:') + url;
      }
      i = match.index;
      addText(raw.substr(0, i));
      addLink(url, match[0].replace(MAILTO_REGEXP, ''));
      raw = raw.substring(i + match[0].length);
    }
    addText(raw);
    return $sanitize(html.join(''));

    function addText(text) {
      if (!text) {
        return;
      }
      html.push(sanitizeText(text));
    }

    function addLink(url, text) {
      var key, linkAttributes = attributesFn(url);
      html.push('<a ');

      for (key in linkAttributes) {
        html.push(key + '="' + linkAttributes[key] + '" ');
      }

      if (isDefined(target) && !('target' in linkAttributes)) {
        html.push('target="',
                  target,
                  '" ');
      }
      html.push('href="',
                url.replace(/"/g, '&quot;'),
                '">');
      addText(text);
      html.push('</a>');
    }
  };
}]);


})(window, window.angular);

(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['angular'], factory);
  } else if (root.hasOwnProperty('angular')) {
    // Browser globals (root is window), we don't register it.
    factory(root.angular);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('angular'));
  }
}(this , function (angular) {
    'use strict';

    // In cases where Angular does not get passed or angular is a truthy value
    // but misses .module we can fall back to using window.
    angular = (angular && angular.module ) ? angular : window.angular;


    function isStorageSupported($window, storageType) {

      // Some installations of IE, for an unknown reason, throw "SCRIPT5: Error: Access is denied"
      // when accessing window.localStorage. This happens before you try to do anything with it. Catch
      // that error and allow execution to continue.

      // fix 'SecurityError: DOM Exception 18' exception in Desktop Safari, Mobile Safari
      // when "Block cookies": "Always block" is turned on
      var supported;
      try {
        supported = $window[storageType];
      }
      catch(err) {
        supported = false;
      }

      // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage and sessionStorage
      // is available, but trying to call .setItem throws an exception below:
      // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage that exceeded the quota."
      if(supported) {
        var key = '__' + Math.round(Math.random() * 1e7);
        try {
          $window[storageType].setItem(key, key);
          $window[storageType].removeItem(key, key);
        }
        catch(err) {
          supported = false;
        }
      }

      return supported;
    }

    /**
     * @ngdoc overview
     * @name ngStorage
     */

    return angular.module('ngStorage', [])

    /**
     * @ngdoc object
     * @name ngStorage.$localStorage
     * @requires $rootScope
     * @requires $window
     */

    .provider('$localStorage', _storageProvider('localStorage'))

    /**
     * @ngdoc object
     * @name ngStorage.$sessionStorage
     * @requires $rootScope
     * @requires $window
     */

    .provider('$sessionStorage', _storageProvider('sessionStorage'));

    function _storageProvider(storageType) {
        var providerWebStorage = isStorageSupported(window, storageType);

        return function () {
          var storageKeyPrefix = 'ngStorage-';

          this.setKeyPrefix = function (prefix) {
            if (typeof prefix !== 'string') {
              throw new TypeError('[ngStorage] - ' + storageType + 'Provider.setKeyPrefix() expects a String.');
            }
            storageKeyPrefix = prefix;
          };

          var serializer = angular.toJson;
          var deserializer = angular.fromJson;

          this.setSerializer = function (s) {
            if (typeof s !== 'function') {
              throw new TypeError('[ngStorage] - ' + storageType + 'Provider.setSerializer expects a function.');
            }

            serializer = s;
          };

          this.setDeserializer = function (d) {
            if (typeof d !== 'function') {
              throw new TypeError('[ngStorage] - ' + storageType + 'Provider.setDeserializer expects a function.');
            }

            deserializer = d;
          };

          this.supported = function() {
            return !!providerWebStorage;
          };

          // Note: This is not very elegant at all.
          this.get = function (key) {
            return providerWebStorage && deserializer(providerWebStorage.getItem(storageKeyPrefix + key));
          };

          // Note: This is not very elegant at all.
          this.set = function (key, value) {
            return providerWebStorage && providerWebStorage.setItem(storageKeyPrefix + key, serializer(value));
          };

          this.remove = function (key) {
            providerWebStorage && providerWebStorage.removeItem(storageKeyPrefix + key);
          }

          this.$get = [
              '$rootScope',
              '$window',
              '$log',
              '$timeout',
              '$document',

              function(
                  $rootScope,
                  $window,
                  $log,
                  $timeout,
                  $document
              ){

                // The magic number 10 is used which only works for some keyPrefixes...
                // See https://github.com/gsklee/ngStorage/issues/137
                var prefixLength = storageKeyPrefix.length;

                // #9: Assign a placeholder object if Web Storage is unavailable to prevent breaking the entire AngularJS app
                // Note: recheck mainly for testing (so we can use $window[storageType] rather than window[storageType])
                var isSupported = isStorageSupported($window, storageType),
                    webStorage = isSupported || ($log.warn('This browser does not support Web Storage!'), {setItem: angular.noop, getItem: angular.noop, removeItem: angular.noop}),
                    $storage = {
                        $default: function(items) {
                            for (var k in items) {
                                angular.isDefined($storage[k]) || ($storage[k] = angular.copy(items[k]) );
                            }

                            $storage.$sync();
                            return $storage;
                        },
                        $reset: function(items) {
                            for (var k in $storage) {
                                '$' === k[0] || (delete $storage[k] && webStorage.removeItem(storageKeyPrefix + k));
                            }

                            return $storage.$default(items);
                        },
                        $sync: function () {
                            for (var i = 0, l = webStorage.length, k; i < l; i++) {
                                // #8, #10: `webStorage.key(i)` may be an empty string (or throw an exception in IE9 if `webStorage` is empty)
                                (k = webStorage.key(i)) && storageKeyPrefix === k.slice(0, prefixLength) && ($storage[k.slice(prefixLength)] = deserializer(webStorage.getItem(k)));
                            }
                        },
                        $apply: function() {
                            var temp$storage;

                            _debounce = null;

                            if (!angular.equals($storage, _last$storage)) {
                                temp$storage = angular.copy(_last$storage);
                                angular.forEach($storage, function(v, k) {
                                    if (angular.isDefined(v) && '$' !== k[0]) {
                                        webStorage.setItem(storageKeyPrefix + k, serializer(v));
                                        delete temp$storage[k];
                                    }
                                });

                                for (var k in temp$storage) {
                                    webStorage.removeItem(storageKeyPrefix + k);
                                }

                                _last$storage = angular.copy($storage);
                            }
                        },
                        $supported: function() {
                            return !!isSupported;
                        }
                    },
                    _last$storage,
                    _debounce;

                $storage.$sync();

                _last$storage = angular.copy($storage);

                $rootScope.$watch(function() {
                    _debounce || (_debounce = $timeout($storage.$apply, 100, false));
                });

                // #6: Use `$window.addEventListener` instead of `angular.element` to avoid the jQuery-specific `event.originalEvent`
                $window.addEventListener && $window.addEventListener('storage', function(event) {
                    if (!event.key) {
                      return;
                    }

                    // Reference doc.
                    var doc = $document[0];

                    if ( (!doc.hasFocus || !doc.hasFocus()) && storageKeyPrefix === event.key.slice(0, prefixLength) ) {
                        event.newValue ? $storage[event.key.slice(prefixLength)] = deserializer(event.newValue) : delete $storage[event.key.slice(prefixLength)];

                        _last$storage = angular.copy($storage);

                        $rootScope.$apply();
                    }
                });

                $window.addEventListener && $window.addEventListener('beforeunload', function() {
                    $storage.$apply();
                });

                return $storage;
              }
          ];
      };
    }

}));

(function() {
  'use strict';
  angular.module('ngMask', []);
})();(function() {
  'use strict';
  angular.module('ngMask')
    .directive('mask', ['$log', '$timeout', 'MaskService', function($log, $timeout, MaskService) {
      return {
        restrict: 'A',
        require: 'ngModel',
        compile: function($element, $attrs) { 
         if (!$attrs.mask || !$attrs.ngModel) {
            $log.info('Mask and ng-model attributes are required!');
            return;
          }

          var maskService = MaskService.create();
          var timeout;
          var promise;

          function setSelectionRange(selectionStart){
            if (typeof selectionStart !== 'number') {
              return;
            }

            // using $timeout:
            // it should run after the DOM has been manipulated by Angular
            // and after the browser renders (which may cause flicker in some cases)
            $timeout.cancel(timeout);
            timeout = $timeout(function(){
              var selectionEnd = selectionStart + 1;
              var input = $element[0];

              if (input.setSelectionRange) {
                input.focus();
                input.setSelectionRange(selectionStart, selectionEnd);
              } else if (input.createTextRange) {
                var range = input.createTextRange();

                range.collapse(true);
                range.moveEnd('character', selectionEnd);
                range.moveStart('character', selectionStart);
                range.select();
              }
            });
          }

          return {
            pre: function($scope, $element, $attrs, controller) {
              promise = maskService.generateRegex({
                mask: $attrs.mask,
                // repeat mask expression n times
                repeat: ($attrs.repeat || $attrs.maskRepeat),
                // clean model value - without divisors
                clean: (($attrs.clean || $attrs.maskClean) === 'true'),
                // limit length based on mask length
                limit: (($attrs.limit || $attrs.maskLimit || 'true') === 'true'),
                // how to act with a wrong value
                restrict: ($attrs.restrict || $attrs.maskRestrict || 'select'), //select, reject, accept
                // set validity mask
                validate: (($attrs.validate || $attrs.maskValidate || 'true') === 'true'),
                // default model value
                model: $attrs.ngModel,
                // default input value
                value: $attrs.ngValue
              });
            },
            post: function($scope, $element, $attrs, controller) {
              var timeout;
              var options = maskService.getOptions();

              function parseViewValue(value) {
                var untouchedValue = value;
                options = maskService.getOptions();
                // set default value equal 0
                value = value || '';

                // get view value object
                var viewValue = maskService.getViewValue(value);

                // get mask without question marks
                var maskWithoutOptionals = options['maskWithoutOptionals'] || '';

                // get view values capped
                // used on view
                var viewValueWithDivisors = viewValue.withDivisors(true);
                // used on model
                var viewValueWithoutDivisors = viewValue.withoutDivisors(true);

                try {
                  // get current regex
                  var regex = maskService.getRegex(viewValueWithDivisors.length - 1);
                  var fullRegex = maskService.getRegex(maskWithoutOptionals.length - 1);

                  // current position is valid
                  var validCurrentPosition = regex.test(viewValueWithDivisors) || fullRegex.test(viewValueWithDivisors);

                  // difference means for select option
                  var diffValueAndViewValueLengthIsOne = (value.length - viewValueWithDivisors.length) === 1;
                  var diffMaskAndViewValueIsGreaterThanZero = (maskWithoutOptionals.length - viewValueWithDivisors.length) > 0;

                  if (options.restrict !== 'accept') {
                    if (options.restrict === 'select' && (!validCurrentPosition || diffValueAndViewValueLengthIsOne)) {
                      var lastCharInputed = value[(value.length-1)];
                      var lastCharGenerated = viewValueWithDivisors[(viewValueWithDivisors.length-1)];

                      if ((lastCharInputed !== lastCharGenerated) && diffMaskAndViewValueIsGreaterThanZero) {
                        viewValueWithDivisors = viewValueWithDivisors + lastCharInputed;
                      }

                      var wrongPosition = maskService.getFirstWrongPosition(viewValueWithDivisors);
                      if (angular.isDefined(wrongPosition)) {
                        setSelectionRange(wrongPosition);
                      }
                    } else if (options.restrict === 'reject' && !validCurrentPosition) {
                      viewValue = maskService.removeWrongPositions(viewValueWithDivisors);
                      viewValueWithDivisors = viewValue.withDivisors(true);
                      viewValueWithoutDivisors = viewValue.withoutDivisors(true);

                      // setSelectionRange(viewValueWithDivisors.length);
                    }
                  }

                  if (!options.limit) {
                    viewValueWithDivisors = viewValue.withDivisors(false);
                    viewValueWithoutDivisors = viewValue.withoutDivisors(false);
                  }

                  // Set validity
                  if (options.validate && controller.$dirty) {
                    if (fullRegex.test(viewValueWithDivisors) || controller.$isEmpty(untouchedValue)) {
                      controller.$setValidity('mask', true);
                    } else {
                      controller.$setValidity('mask', false);
                    }
                  }

                  // Update view and model values
                  if(value !== viewValueWithDivisors){
                    controller.$setViewValue(angular.copy(viewValueWithDivisors), 'input');
                    controller.$render();
                  }
                } catch (e) {
                  $log.error('[mask - parseViewValue]');
                  throw e;
                }

                // Update model, can be different of view value
                if (options.clean) {
                  return viewValueWithoutDivisors;
                } else {
                  return viewValueWithDivisors;
                }
              }

              var callParseViewValue = function() {
                parseViewValue();

                controller.$parsers.push(parseViewValue);

                // $evalAsync from a directive
                // it should run after the DOM has been manipulated by Angular
                // but before the browser renders
                if(options.value) {
                  $scope.$evalAsync(function($scope) {
                    controller.$setViewValue(angular.copy(options.value), 'input');
                    controller.$render();
                  });
                }
              }

              $element.on('click input paste keyup', function() {
                timeout = $timeout(function() {
                  // Manual debounce to prevent multiple execution
                  $timeout.cancel(timeout);

                  parseViewValue($element.val());
                  $scope.$apply();
                }, 100);
              });

              // Register the watch to observe remote loading or promised data
              // Deregister calling returned function
              var watcher = $scope.$watch($attrs.ngModel, function (newValue, oldValue) {
                if (angular.isDefined(newValue)) {
                  parseViewValue(newValue);
                  watcher();
                }
              });

              $scope.$watch(function () {
                return [$attrs.mask];
              }, function() {
                promise = maskService.generateRegex({
                  mask: $attrs.mask,
                  // repeat mask expression n times
                  repeat: ($attrs.repeat || $attrs.maskRepeat),
                  // clean model value - without divisors
                  clean: (($attrs.clean || $attrs.maskClean) === 'true'),
                  // limit length based on mask length
                  limit: (($attrs.limit || $attrs.maskLimit || 'true') === 'true'),
                  // how to act with a wrong value
                  restrict: ($attrs.restrict || $attrs.maskRestrict || 'select'), //select, reject, accept
                  // set validity mask
                  validate: (($attrs.validate || $attrs.maskValidate || 'true') === 'true'),
                  // default model value
                  model: $attrs.ngModel,
                  // default input value
                  value: $attrs.ngValue
                }).then(function() {
                  $element.triggerHandler('click');
                });

                promise.then(callParseViewValue);
              }, true);

              promise.then(callParseViewValue);
            }
          }
        }
      }
    }]);
})();
(function() {
  'use strict';
  angular.module('ngMask')
    .factory('MaskService', ['$q', 'OptionalService', 'UtilService', function($q, OptionalService, UtilService) {
      function create() {
        var options;
        var maskWithoutOptionals;
        var maskWithoutOptionalsLength = 0;
        var maskWithoutOptionalsAndDivisorsLength = 0;
        var optionalIndexes = [];
        var optionalDivisors = {};
        var optionalDivisorsCombinations = [];
        var divisors = [];
        var divisorElements = {};
        var regex = [];
        var patterns = {
          '9': /[0-9]/,
          '8': /[0-8]/,
          '7': /[0-7]/,
          '6': /[0-6]/,
          '5': /[0-5]/,
          '4': /[0-4]/,
          '3': /[0-3]/,
          '2': /[0-2]/,
          '1': /[0-1]/,
          '0': /[0]/,
          '*': /./,
          'w': /\w/,
          'W': /\W/,
          'd': /\d/,
          'D': /\D/,
          's': /\s/,
          'S': /\S/,
          'b': /\b/,
          'A': /[A-Z]/,
          'a': /[a-z]/,
          'Z': /[A-ZÇÀÁÂÃÈÉÊẼÌÍÎĨÒÓÔÕÙÚÛŨ]/,
          'z': /[a-zçáàãâéèêẽíìĩîóòôõúùũüû]/,
          '@': /[a-zA-Z]/,
          '#': /[a-zA-ZçáàãâéèêẽíìĩîóòôõúùũüûÇÀÁÂÃÈÉÊẼÌÍÎĨÒÓÔÕÙÚÛŨ]/,
          '%': /[0-9a-zA-ZçáàãâéèêẽíìĩîóòôõúùũüûÇÀÁÂÃÈÉÊẼÌÍÎĨÒÓÔÕÙÚÛŨ]/
        };

        // REGEX

        function generateIntermetiateElementRegex(i, forceOptional) {
          var charRegex;
          try {
            var element = maskWithoutOptionals[i];
            var elementRegex = patterns[element];
            var hasOptional = isOptional(i);

            if (elementRegex) {
              charRegex = '(' + elementRegex.source + ')';
            } else { // is a divisor
              if (!isDivisor(i)) {
                divisors.push(i);
                divisorElements[i] = element;
              }

              charRegex = '(' + '\\' + element + ')';
            }
          } catch (e) {
            throw e;
          }

          if (hasOptional || forceOptional) {
            charRegex += '?';
          }

          return new RegExp(charRegex);
        }

        function generateIntermetiateRegex(i, forceOptional) {


          var elementRegex
          var elementOptionalRegex;
          try {
            var intermetiateElementRegex = generateIntermetiateElementRegex(i, forceOptional);
            elementRegex = intermetiateElementRegex;

            var hasOptional = isOptional(i);
            var currentRegex = intermetiateElementRegex.source;

            if (hasOptional && ((i+1) < maskWithoutOptionalsLength)) {
              var intermetiateRegex = generateIntermetiateRegex((i+1), true).elementOptionalRegex();
              currentRegex += intermetiateRegex.source;
            }

            elementOptionalRegex = new RegExp(currentRegex);
          } catch (e) {
            throw e;
          }
          return {
            elementRegex: function() {
              return elementRegex;
            },
            elementOptionalRegex: function() {
              // from element regex, gets the flow of regex until first not optional
              return elementOptionalRegex;
            }
          };
        }

        function generateRegex(opts) {
          var deferred = $q.defer();
          maskWithoutOptionals = null;
          maskWithoutOptionalsLength = 0;
          maskWithoutOptionalsAndDivisorsLength = 0;
          optionalIndexes = [];
          optionalDivisors = {};
          optionalDivisorsCombinations = [];
          divisors = [];
          divisorElements = {};
          regex = [];
          options = opts;

          try {
            var mask = opts['mask'];
            var repeat = opts['repeat'];

            if (!mask)
              return;

            if (repeat) {
              mask = Array((parseInt(repeat)+1)).join(mask);
            }

            optionalIndexes = OptionalService.getOptionals(mask).fromMaskWithoutOptionals();
            options['maskWithoutOptionals'] = maskWithoutOptionals = OptionalService.removeOptionals(mask);
            maskWithoutOptionalsLength = maskWithoutOptionals.length;

            var cumulativeRegex;
            for (var i=0; i<maskWithoutOptionalsLength; i++) {
              var charRegex = generateIntermetiateRegex(i);
              var elementRegex = charRegex.elementRegex();
              var elementOptionalRegex = charRegex.elementOptionalRegex();

              var newRegex = cumulativeRegex ? cumulativeRegex.source + elementOptionalRegex.source : elementOptionalRegex.source;
              newRegex = new RegExp(newRegex);
              cumulativeRegex = cumulativeRegex ? cumulativeRegex.source + elementRegex.source : elementRegex.source;
              cumulativeRegex = new RegExp(cumulativeRegex);

              regex.push(newRegex);
            }

            generateOptionalDivisors();
            maskWithoutOptionalsAndDivisorsLength = removeDivisors(maskWithoutOptionals).length;

            deferred.resolve({
              options: options,
              divisors: divisors,
              divisorElements: divisorElements,
              optionalIndexes: optionalIndexes,
              optionalDivisors: optionalDivisors,
              optionalDivisorsCombinations: optionalDivisorsCombinations
            });
          } catch (e) {
            deferred.reject(e);
            throw e;
          }

          return deferred.promise;
        }

        function getRegex(index) {
          var currentRegex;

          try {
            currentRegex = regex[index] ? regex[index].source : '';
          } catch (e) {
            throw e;
          }

          return (new RegExp('^' + currentRegex + '$'));
        }

        // DIVISOR

        function isOptional(currentPos) {
          return UtilService.inArray(currentPos, optionalIndexes);
        }

        function isDivisor(currentPos) {
          return UtilService.inArray(currentPos, divisors);
        }

        function generateOptionalDivisors() {
          function sortNumber(a,b) {
              return a - b;
          }

          var sortedDivisors = divisors.sort(sortNumber);
          var sortedOptionals = optionalIndexes.sort(sortNumber);
          for (var i = 0; i<sortedDivisors.length; i++) {
            var divisor = sortedDivisors[i];
            for (var j = 1; j<=sortedOptionals.length; j++) {
              var optional = sortedOptionals[(j-1)];
              if (optional >= divisor) {
                break;
              }

              if (optionalDivisors[divisor]) {
                optionalDivisors[divisor] = optionalDivisors[divisor].concat(divisor-j);
              } else {
                optionalDivisors[divisor] = [(divisor-j)];
              }

              // get the original divisor for alternative divisor
              divisorElements[(divisor-j)] = divisorElements[divisor];
            }
          }
        }

        function removeDivisors(value) {
              value = value.toString();
          try {
            if (divisors.length > 0 && value) {
              var keys = Object.keys(divisorElements);
              var elments = [];

              for (var i = keys.length - 1; i >= 0; i--) {
                var divisor = divisorElements[keys[i]];
                if (divisor) {
                  elments.push(divisor);
                }
              }

              elments = UtilService.uniqueArray(elments);

              // remove if it is not pattern
              var regex = new RegExp(('[' + '\\' + elments.join('\\') + ']'), 'g');
              return value.replace(regex, '');
            } else {
              return value;
            }
          } catch (e) {
            throw e;
          }
        }

        function insertDivisors(array, combination) {
          function insert(array, output) {
            var out = output;
            for (var i=0; i<array.length; i++) {
              var divisor = array[i];
              if (divisor < out.length) {
                out.splice(divisor, 0, divisorElements[divisor]);
              }
            }
            return out;
          }

          var output = array;
          var divs = divisors.filter(function(it) {
            var optionalDivisorsKeys = Object.keys(optionalDivisors).map(function(it){
              return parseInt(it);
            });

            return !UtilService.inArray(it, combination) && !UtilService.inArray(it, optionalDivisorsKeys);
          });

          if (!angular.isArray(array) || !angular.isArray(combination)) {
            return output;
          }

          // insert not optional divisors
          output = insert(divs, output);

          // insert optional divisors
          output = insert(combination, output);

          return output;
        }

        function tryDivisorConfiguration(value) {
          var output = value.split('');
          var defaultDivisors = true;

          // has optional?
          if (optionalIndexes.length > 0) {
            var lazyArguments = [];
            var optionalDivisorsKeys = Object.keys(optionalDivisors);

            // get all optional divisors as array of arrays [[], [], []...]
            for (var i=0; i<optionalDivisorsKeys.length; i++) {
              var val = optionalDivisors[optionalDivisorsKeys[i]];
              lazyArguments.push(val);
            }

            // generate all possible configurations
            if (optionalDivisorsCombinations.length === 0) {
              UtilService.lazyProduct(lazyArguments, function() {
                // convert arguments to array
                optionalDivisorsCombinations.push(Array.prototype.slice.call(arguments));
              });
            }

            for (var i = optionalDivisorsCombinations.length - 1; i >= 0; i--) {
              var outputClone = angular.copy(output);
              outputClone = insertDivisors(outputClone, optionalDivisorsCombinations[i]);

              // try validation
              var viewValueWithDivisors = outputClone.join('');
              var regex = getRegex(maskWithoutOptionals.length - 1);

              if (regex.test(viewValueWithDivisors)) {
                defaultDivisors = false;
                output = outputClone;
                break;
              }
            }
          }

          if (defaultDivisors) {
            output = insertDivisors(output, divisors);
          }

          return output.join('');
        }

        // MASK

        function getOptions() {
          return options;
        }

        function getViewValue(value) {
          try {
            var outputWithoutDivisors = removeDivisors(value);
            var output = tryDivisorConfiguration(outputWithoutDivisors);

            return {
              withDivisors: function(capped) {
                if (capped) {
                  return output.substr(0, maskWithoutOptionalsLength);
                } else {
                  return output;
                }
              },
              withoutDivisors: function(capped) {
                if (capped) {
                  return outputWithoutDivisors.substr(0, maskWithoutOptionalsAndDivisorsLength);
                } else {
                  return outputWithoutDivisors;
                }
              }
            };
          } catch (e) {
            throw e;
          }
        }

        // SELECTOR

        function getWrongPositions(viewValueWithDivisors, onlyFirst) {
          var pos = [];

          if (!viewValueWithDivisors) {
            return 0;
          }

          for (var i=0; i<viewValueWithDivisors.length; i++){
            var pattern = getRegex(i);
            var value = viewValueWithDivisors.substr(0, (i+1));

            if(pattern && !pattern.test(value)){
              pos.push(i);

              if (onlyFirst) {
                break;
              }
            }
          }

          return pos;
        }

        function getFirstWrongPosition(viewValueWithDivisors) {
          return getWrongPositions(viewValueWithDivisors, true)[0];
        }

        function removeWrongPositions(viewValueWithDivisors) {
          var wrongPositions = getWrongPositions(viewValueWithDivisors, false);
          var newViewValue = viewValueWithDivisors;

          for(var i = 0; i < wrongPositions.length; i++){
            var wrongPosition = wrongPositions[i];
            var viewValueArray = viewValueWithDivisors.split('');
            viewValueArray.splice(wrongPosition, 1);
            newViewValue = viewValueArray.join('');
          }

          return getViewValue(newViewValue);
        }

        return {
          getViewValue: getViewValue,
          generateRegex: generateRegex,
          getRegex: getRegex,
          getOptions: getOptions,
          removeDivisors: removeDivisors,
          getFirstWrongPosition: getFirstWrongPosition,
          removeWrongPositions: removeWrongPositions
        }
      }

      return {
        create: create
      }
    }]);
})();
(function() {
  'use strict';
  angular.module('ngMask')
    .factory('OptionalService', [function() {
      function getOptionalsIndexes(mask) {
        var indexes = [];

        try {
          var regexp = /\?/g;
          var match = [];

          while ((match = regexp.exec(mask)) != null) {
            // Save the optional char
            indexes.push((match.index - 1));
          }
        } catch (e) {
          throw e;
        }

        return {
          fromMask: function() {
            return indexes;
          },
          fromMaskWithoutOptionals: function() {
            return getOptionalsRelativeMaskWithoutOptionals(indexes);
          }
        };
      }

      function getOptionalsRelativeMaskWithoutOptionals(optionals) {
        var indexes = [];
        for (var i=0; i<optionals.length; i++) {
          indexes.push(optionals[i]-i);
        }
        return indexes;
      }

      function removeOptionals(mask) {
        var newMask;

        try {
          newMask = mask.replace(/\?/g, '');
        } catch (e) {
          throw e;
        }

        return newMask;
      }

      return {
        removeOptionals: removeOptionals,
        getOptionals: getOptionalsIndexes
      }
    }]);
})();(function() {
  'use strict';
  angular.module('ngMask')
    .factory('UtilService', [function() {

      // sets: an array of arrays
      // f: your callback function
      // context: [optional] the `this` to use for your callback
      // http://phrogz.net/lazy-cartesian-product
      function lazyProduct(sets, f, context){
        if (!context){
          context=this;
        }

        var p = [];
        var max = sets.length-1;
        var lens = [];

        for (var i=sets.length;i--;) {
          lens[i] = sets[i].length;
        }

        function dive(d){
          var a = sets[d];
          var len = lens[d];

          if (d === max) {
            for (var i=0;i<len;++i) {
              p[d] = a[i];
              f.apply(context, p);
            }
          } else {
            for (var i=0;i<len;++i) {
              p[d]=a[i];
              dive(d+1);
            }
          }

          p.pop();
        }

        dive(0);
      }

      function inArray(i, array) {
        var output;

        try {
          output = array.indexOf(i) > -1;
        } catch (e) {
          throw e;
        }

        return output;
      }

      function uniqueArray(array) {
        var u = {};
        var a = [];

        for (var i = 0, l = array.length; i < l; ++i) {
          if(u.hasOwnProperty(array[i])) {
            continue;
          }

          a.push(array[i]);
          u[array[i]] = 1;
        }

        return a;
      }

      return {
        lazyProduct: lazyProduct,
        inArray: inArray,
        uniqueArray: uniqueArray
      }
    }]);
})();
// Generated by CoffeeScript 1.12.5
var CustomEvent, ce, e;

Date.prototype.getDateAdd = function(date, interval, units) {
  var checkRollover, ret;
  ret = new Date(date);
  checkRollover = function() {
    if (ret.getDate() !== date.getDate()) {
      return ret.setDate(0);
    }
  };
  switch (interval.toLowerCase()) {
    case "year":
      ret.setFullYear(ret.getFullYear() + units);
      checkRollover();
      break;
    case "quarter":
      ret.setMonth(ret.getMonth() + 3 * units);
      checkRollover();
      break;
    case "month":
      ret.setMonth(ret.getMonth() + units);
      checkRollover();
      break;
    case "week":
      ret.setDate(ret.getDate() + 7 * units);
      break;
    case "day":
      ret.setDate(ret.getDate() + units);
      break;
    case "hour":
      ret.setTime(ret.getTime() + units * 3600000);
      break;
    case "minute":
      ret.setTime(ret.getTime() + units * 60000);
      break;
    case "second":
      ret.setTime(ret.getTime() + units * 1000);
      break;
    default:
      ret = void 0;
  }
  return ret;
};

Object.size = function(obj) {
  return Object.keys(obj).length;
};

Object.get = function(obj, path, curr) {
  var i, key, len, paths;
  if (curr == null) {
    curr = obj;
  }
  paths = path.split(".");
  for (i = 0, len = paths.length; i < len; i++) {
    key = paths[i];
    curr = curr[key] !== void 0 ? curr[key] : void 0;
  }
  return curr;
};

try {
  ce = new window.CustomEvent('test');
  ce.preventDefault();
  if (ce.defaultPrevented !== true) {
    throw new Error('Could not prevent default');
  }
} catch (error) {
  e = error;
  CustomEvent = function(event, params) {
    var evt, origPrevent;
    params = params || {
      bubbles: false,
      cancelable: false,
      detail: void 0
    };
    evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    origPrevent = evt.preventDefault;
    evt.preventDefault = function() {
      origPrevent.call(this);
      try {
        return Object.defineProperty(this, 'defaultPrevented', {
          get: function() {
            return true;
          }
        });
      } catch (error) {
        e = error;
        return this.defaultPrevented = true;
      }
    };
    return evt;
  };
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
}

!function(e){function t(a){if(n[a])return n[a].exports;var i=n[a]={i:a,l:!1,exports:{}};return e[a].call(i.exports,i,i.exports,t),i.l=!0,i.exports}var n={};t.m=e,t.c=n,t.i=function(e){return e},t.d=function(e,n,a){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:a})},t.n=function(e){var n=e&&e.__esModule?function(){return e["default"]}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=9)}([function(e,t,n){"use strict";var a,i,r;"function"==typeof Symbol&&Symbol.iterator,!function(o){i=[n(2)],a=o,void 0!==(r="function"==typeof a?a.apply(t,i):a)&&(e.exports=r)}(function(e){return e})},function(e,t,n){"use strict";var a,i,r,o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};!function(o){i=[n(0),n(11),n(10)],a=o,void 0!==(r="function"==typeof a?a.apply(t,i):a)&&(e.exports=r)}(function(e,t,n,a){function i(t,n,o){return this instanceof i?(this.el=a,this.events={},this.maskset=a,this.refreshValue=!1,!0!==o&&(e.isPlainObject(t)?n=t:(n=n||{},n.alias=t),this.opts=e.extend(!0,{},this.defaults,n),this.noMasksCache=n&&n.definitions!==a,this.userOptions=n||{},this.isRTL=this.opts.numericInput,r(this.opts.alias,n,this.opts)),void 0):new i(t,n,o)}function r(t,n,o){var s=i.prototype.aliases[t];return s?(s.alias&&r(s.alias,a,o),e.extend(!0,o,s),e.extend(!0,o,n),!0):(null===o.mask&&(o.mask=t),!1)}function s(t,n){function r(t,r,o){var s=!1;if(null!==t&&""!==t||(s=null!==o.regex,s?(t=o.regex,t=t.replace(/^(\^)(.*)(\$)$/,"$2")):(s=!0,t=".*")),1===t.length&&!1===o.greedy&&0!==o.repeat&&(o.placeholder=""),o.repeat>0||"*"===o.repeat||"+"===o.repeat){var l="*"===o.repeat?0:"+"===o.repeat?1:o.repeat;t=o.groupmarker.start+t+o.groupmarker.end+o.quantifiermarker.start+l+","+o.repeat+o.quantifiermarker.end}var c,u=s?"regex_"+o.regex:o.numericInput?t.split("").reverse().join(""):t;return i.prototype.masksCache[u]===a||!0===n?(c={mask:t,maskToken:i.prototype.analyseMask(t,s,o),validPositions:{},_buffer:a,buffer:a,tests:{},metadata:r,maskLength:a},!0!==n&&(i.prototype.masksCache[u]=c,c=e.extend(!0,{},i.prototype.masksCache[u]))):c=e.extend(!0,{},i.prototype.masksCache[u]),c}if(e.isFunction(t.mask)&&(t.mask=t.mask(t)),e.isArray(t.mask)){if(t.mask.length>1){t.keepStatic=null===t.keepStatic||t.keepStatic;var o=t.groupmarker.start;return e.each(t.numericInput?t.mask.reverse():t.mask,function(n,i){o.length>1&&(o+=t.groupmarker.end+t.alternatormarker+t.groupmarker.start),o+=i.mask===a||e.isFunction(i.mask)?i:i.mask}),o+=t.groupmarker.end,r(o,t.mask,t)}t.mask=t.mask.pop()}return t.mask&&t.mask.mask!==a&&!e.isFunction(t.mask.mask)?r(t.mask.mask,t.mask,t):r(t.mask,t.mask,t)}function l(r,s,c){function m(e,t,n){t=t||0;var i,r,o,s=[],l=0,u=v();do!0===e&&h().validPositions[l]?(o=h().validPositions[l],r=o.match,i=o.locator.slice(),s.push(!0===n?o.input:!1===n?r.nativeDef:I(l,r))):(o=b(l,i,l-1),r=o.match,i=o.locator.slice(),(!1===c.jitMasking||u>l||"number"==typeof c.jitMasking&&isFinite(c.jitMasking)&&c.jitMasking>l)&&s.push(!1===n?r.nativeDef:I(l,r))),l++;while(($===a||$>l)&&(null!==r.fn||""!==r.def)||t>l);return""===s[s.length-1]&&s.pop(),h().maskLength=l+1,s}function h(){return s}function g(e){var t=h();t.buffer=a,!0!==e&&(t.validPositions={},t.p=0)}function v(e,t,n){var i=-1,r=-1,o=n||h().validPositions;e===a&&(e=-1);for(var s in o){var l=parseInt(s);o[l]&&(t||!0!==o[l].generatedInput)&&(e>=l&&(i=l),l>=e&&(r=l))}return-1!==i&&e-i>1||e>r?i:r}function y(t,n,i,r){var o,s=t,l=e.extend(!0,{},h().validPositions),u=!1;for(h().p=t,o=n-1;o>=s;o--)h().validPositions[o]!==a&&(!0!==i&&(!h().validPositions[o].match.optionality&&function(e){var t=h().validPositions[e];if(t!==a&&null===t.match.fn){var n=h().validPositions[e-1],i=h().validPositions[e+1];return n!==a&&i!==a}return!1}(o)||!1===c.canClearPosition(h(),o,v(),r,c))||delete h().validPositions[o]);for(g(!0),o=s+1;o<=v();){for(;h().validPositions[s]!==a;)s++;if(s>o&&(o=s+1),h().validPositions[o]===a&&M(o))o++;else{var p=b(o);!1===u&&l[s]&&l[s].match.def===p.match.def?(h().validPositions[s]=e.extend(!0,{},l[s]),h().validPositions[s].input=p.input,delete h().validPositions[o],o++):P(s,p.match.def)?!1!==R(s,p.input||I(o),!0)&&(delete h().validPositions[o],o++,u=!0):M(o)||(o++,s--),s++}}g(!0)}function k(e,t){for(var n,i=e,r=v(),o=h().validPositions[r]||S(0)[0],s=o.alternation!==a?o.locator[o.alternation].toString().split(","):[],l=0;l<i.length&&(n=i[l],!(n.match&&(c.greedy&&!0!==n.match.optionalQuantifier||(!1===n.match.optionality||!1===n.match.newBlockMarker)&&!0!==n.match.optionalQuantifier)&&(o.alternation===a||o.alternation!==n.alternation||n.locator[o.alternation]!==a&&O(n.locator[o.alternation].toString().split(","),s)))||!0===t&&(null!==n.match.fn||/[0-9a-bA-Z]/.test(n.match.def)));l++);return n}function b(e,t,n){return h().validPositions[e]||k(S(e,t?t.slice():t,n))}function x(e){return h().validPositions[e]?h().validPositions[e]:S(e)[0]}function P(e,t){for(var n=!1,a=S(e),i=0;i<a.length;i++)if(a[i].match&&a[i].match.def===t){n=!0;break}return n}function S(t,n,i){function r(n,i,o,l){function p(o,l,g){function v(t,n){var a=0===e.inArray(t,n.matches);return a||e.each(n.matches,function(e,i){return!0===i.isQuantifier&&(a=v(t,n.matches[e-1]))?!1:void 0}),a}function y(t,n,i){var r,o;if(h().validPositions[t-1]&&i&&h().tests[t])for(var s=h().validPositions[t-1].locator,l=h().tests[t][0].locator,c=0;i>c;c++)if(s[c]!==l[c])return s.slice(i+1);return(h().tests[t]||h().validPositions[t])&&e.each(h().tests[t]||[h().validPositions[t]],function(e,t){var s=i!==a?i:t.alternation,l=t.locator[s]!==a?t.locator[s].toString().indexOf(n):-1;(o===a||o>l)&&-1!==l&&(r=t,o=l)}),r?r.locator.slice((i!==a?i:r.alternation)+1):i!==a?y(t,n):a}if(u>1e4)throw"Inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. "+h().mask;if(u===t&&o.matches===a)return f.push({match:o,locator:l.reverse(),cd:m}),!0;if(o.matches!==a){if(o.isGroup&&g!==o){if(o=p(n.matches[e.inArray(o,n.matches)+1],l))return!0}else if(o.isOptional){var k=o;if(o=r(o,i,l,g)){if(s=f[f.length-1].match,!v(s,k))return!0;d=!0,u=t}}else if(o.isAlternator){var b,x=o,P=[],S=f.slice(),w=l.length,A=i.length>0?i.shift():-1;if(-1===A||"string"==typeof A){var E,C=u,O=i.slice(),R=[];if("string"==typeof A)R=A.split(",");else for(E=0;E<x.matches.length;E++)R.push(E);for(var M=0;M<R.length;M++){if(E=parseInt(R[M]),f=[],i=y(u,E,w)||O.slice(),!0!==(o=p(x.matches[E]||n.matches[E],[E].concat(l),g)||o)&&o!==a&&R[R.length-1]<x.matches.length){var _=e.inArray(o,n.matches)+1;n.matches.length>_&&(o=p(n.matches[_],[_].concat(l.slice(1,l.length)),g))&&(R.push(_.toString()),e.each(f,function(e,t){t.alternation=l.length-1}))}b=f.slice(),u=C,f=[];for(var D=0;D<b.length;D++){var j=b[D],N=!1;j.alternation=j.alternation||w;for(var I=0;I<P.length;I++){var F=P[I];if("string"!=typeof A||-1!==e.inArray(j.locator[j.alternation].toString(),R)){if(function(e,t){return e.match.nativeDef===t.match.nativeDef||e.match.def===t.match.nativeDef||e.match.nativeDef===t.match.def}(j,F)){N=!0,j.alternation===F.alternation&&-1===F.locator[F.alternation].toString().indexOf(j.locator[j.alternation])&&(F.locator[F.alternation]=F.locator[F.alternation]+","+j.locator[j.alternation],F.alternation=j.alternation),j.match.nativeDef===F.match.def&&(j.locator[j.alternation]=F.locator[F.alternation],P.splice(P.indexOf(F),1,j));break}if(j.match.def===F.match.def){N=!1;break}if(function(e,n){return null===e.match.fn&&null!==n.match.fn&&n.match.fn.test(e.match.def,h(),t,!1,c,!1)}(j,F)||function(e,n){return null!==e.match.fn&&null!==n.match.fn&&n.match.fn.test(e.match.def.replace(/[\[\]]/g,""),h(),t,!1,c,!1)}(j,F)){j.alternation===F.alternation&&-1===j.locator[j.alternation].toString().indexOf(F.locator[F.alternation].toString().split("")[0])&&(j.na=j.na||j.locator[j.alternation].toString(),-1===j.na.indexOf(j.locator[j.alternation].toString().split("")[0])&&(j.na=j.na+","+j.locator[F.alternation].toString().split("")[0]),N=!0,j.locator[j.alternation]=F.locator[F.alternation].toString().split("")[0]+","+j.locator[j.alternation],P.splice(P.indexOf(F),0,j));break}}}N||P.push(j)}}"string"==typeof A&&(P=e.map(P,function(t,n){if(isFinite(n)){var i=t.alternation,r=t.locator[i].toString().split(",");t.locator[i]=a,t.alternation=a;for(var o=0;o<r.length;o++)-1!==e.inArray(r[o],R)&&(t.locator[i]!==a?(t.locator[i]+=",",t.locator[i]+=r[o]):t.locator[i]=parseInt(r[o]),t.alternation=i);if(t.locator[i]!==a)return t}})),f=S.concat(P),u=t,d=f.length>0,o=P.length>0,i=O.slice()}else o=p(x.matches[A]||n.matches[A],[A].concat(l),g);if(o)return!0}else if(o.isQuantifier&&g!==n.matches[e.inArray(o,n.matches)-1])for(var T=o,B=i.length>0?i.shift():0;B<(isNaN(T.quantifier.max)?B+1:T.quantifier.max)&&t>=u;B++){var G=n.matches[e.inArray(T,n.matches)-1];if(o=p(G,[B].concat(l),G)){if(s=f[f.length-1].match,s.optionalQuantifier=B>T.quantifier.min-1,v(s,G)){if(B>T.quantifier.min-1){d=!0,u=t;break}return!0}return!0}}else if(o=r(o,i,l,g))return!0}else u++}for(var g=i.length>0?i.shift():0;g<n.matches.length;g++)if(!0!==n.matches[g].isQuantifier){var v=p(n.matches[g],[g].concat(o),l);if(v&&u===t)return v;if(u>t)break}}function o(e){if(c.keepStatic&&t>0&&e.length>1+(""===e[e.length-1].match.def?1:0)&&!0!==e[0].match.optionality&&!0!==e[0].match.optionalQuantifier&&null===e[0].match.fn&&!/[0-9a-bA-Z]/.test(e[0].match.def)){if(h().validPositions[t-1]===a)return[k(e)];if(h().validPositions[t-1].alternation===e[0].alternation)return[k(e)];if(h().validPositions[t-1])return[k(e)]}return e}var s,l=h().maskToken,u=n?i:0,p=n?n.slice():[0],f=[],d=!1,m=n?n.join(""):"";if(t>-1){if(n===a){for(var g,v=t-1;(g=h().validPositions[v]||h().tests[v])===a&&v>-1;)v--;g!==a&&v>-1&&(p=function(t){var n=[];return e.isArray(t)||(t=[t]),t.length>0&&(t[0].alternation===a?(n=k(t.slice()).locator.slice(),0===n.length&&(n=t[0].locator.slice())):e.each(t,function(e,t){if(""!==t.def)if(0===n.length)n=t.locator.slice();else for(var a=0;a<n.length;a++)t.locator[a]&&-1===n[a].toString().indexOf(t.locator[a])&&(n[a]+=","+t.locator[a])})),n}(g),m=p.join(""),u=v)}if(h().tests[t]&&h().tests[t][0].cd===m)return o(h().tests[t]);for(var y=p.shift();y<l.length&&!(r(l[y],p,[y])&&u===t||u>t);y++);}return(0===f.length||d)&&f.push({match:{fn:null,cardinality:0,optionality:!0,casing:null,def:"",placeholder:""},locator:[],cd:m}),n!==a&&h().tests[t]?o(e.extend(!0,[],f)):(h().tests[t]=e.extend(!0,[],f),o(h().tests[t]))}function w(){return h()._buffer===a&&(h()._buffer=m(!1,1),h().buffer===a&&(h().buffer=h()._buffer.slice())),h()._buffer}function A(e){return h().buffer!==a&&!0!==e||(h().buffer=m(!0,v(),!0)),h().buffer}function E(e,t,n){var i,r;if(!0===e)g(),e=0,t=n.length;else for(i=e;t>i;i++)delete h().validPositions[i];for(r=e,i=e;t>i;i++)if(g(!0),n[i]!==c.skipOptionalPartCharacter){var o=R(r,n[i],!0,!0);!1!==o&&(g(!0),r=o.caret!==a?o.caret:o.pos+1)}}function C(t,n,a){switch(c.casing||n.casing){case"upper":t=t.toUpperCase();break;case"lower":t=t.toLowerCase();break;case"title":var r=h().validPositions[a-1];t=0===a||r&&r.input===String.fromCharCode(i.keyCode.SPACE)?t.toUpperCase():t.toLowerCase();break;default:if(e.isFunction(c.casing)){var o=Array.prototype.slice.call(arguments);o.push(h().validPositions),t=c.casing.apply(this,o)}}return t}function O(t,n,i){for(var r,o=c.greedy?n:n.slice(0,1),s=!1,l=i!==a?i.split(","):[],u=0;u<l.length;u++)-1!==(r=t.indexOf(l[u]))&&t.splice(r,1);for(var p=0;p<t.length;p++)if(-1!==e.inArray(t[p],o)){s=!0;break}return s}function R(t,n,r,o,s,l){function u(e){var t=Z?e.begin-e.end>1||e.begin-e.end==1:e.end-e.begin>1||e.end-e.begin==1;return t&&0===e.begin&&e.end===h().maskLength?"full":t}function p(n,i,r){var s=!1;return e.each(S(n),function(l,p){for(var d=p.match,m=i?1:0,k="",b=d.cardinality;b>m;b--)k+=j(n-(b-1));if(i&&(k+=i),A(!0),!1!==(s=null!=d.fn?d.fn.test(k,h(),n,r,c,u(t)):(i===d.def||i===c.skipOptionalPartCharacter)&&""!==d.def&&{c:I(n,d,!0)||d.def,pos:n})){var x=s.c!==a?s.c:i;x=x===c.skipOptionalPartCharacter&&null===d.fn?I(n,d,!0)||d.def:x;var P=n,S=A();if(s.remove!==a&&(e.isArray(s.remove)||(s.remove=[s.remove]),e.each(s.remove.sort(function(e,t){return t-e}),function(e,t){y(t,t+1,!0)})),s.insert!==a&&(e.isArray(s.insert)||(s.insert=[s.insert]),e.each(s.insert.sort(function(e,t){return e-t}),function(e,t){R(t.pos,t.c,!0,o)})),s.refreshFromBuffer){var w=s.refreshFromBuffer;if(E(!0===w?w:w.start,w.end,S),s.pos===a&&s.c===a)return s.pos=v(),!1;if((P=s.pos!==a?s.pos:n)!==n)return s=e.extend(s,R(P,x,!0,o)),!1}else if(!0!==s&&s.pos!==a&&s.pos!==n&&(P=s.pos,E(n,P,A().slice()),P!==n))return s=e.extend(s,R(P,x,!0)),!1;return(!0===s||s.pos!==a||s.c!==a)&&(l>0&&g(!0),f(P,e.extend({},p,{input:C(x,d,P)}),o,u(t))||(s=!1),!1)}}),s}function f(t,n,i,r){if(r||c.insertMode&&h().validPositions[t]!==a&&i===a){var o,s=e.extend(!0,{},h().validPositions),l=v(a,!0);for(o=t;l>=o;o++)delete h().validPositions[o];h().validPositions[t]=e.extend(!0,{},n);var u,p=!0,f=h().validPositions,m=!1,y=h().maskLength;for(o=u=t;l>=o;o++){var k=s[o];if(k!==a)for(var b=u;b<h().maskLength&&(null===k.match.fn&&f[o]&&(!0===f[o].match.optionalQuantifier||!0===f[o].match.optionality)||null!=k.match.fn);){if(b++,!1===m&&s[b]&&s[b].match.def===k.match.def)h().validPositions[b]=e.extend(!0,{},s[b]),h().validPositions[b].input=k.input,d(b),u=b,p=!0;else if(P(b,k.match.def)){var x=R(b,k.input,!0,!0);p=!1!==x,u=x.caret||x.insert?v():b,m=!0}else if(!(p=!0===k.generatedInput)&&b>=h().maskLength-1)break;if(h().maskLength<y&&(h().maskLength=y),p)break}if(!p)break}if(!p)return h().validPositions=e.extend(!0,{},s),g(!0),!1}else h().validPositions[t]=e.extend(!0,{},n);return g(!0),!0}function d(t){for(var n=t-1;n>-1&&!h().validPositions[n];n--);var i,r;for(n++;t>n;n++)h().validPositions[n]===a&&(!1===c.jitMasking||c.jitMasking>n)&&(r=S(n,b(n-1).locator,n-1).slice(),""===r[r.length-1].match.def&&r.pop(),(i=k(r))&&(i.match.def===c.radixPointDefinitionSymbol||!M(n,!0)||e.inArray(c.radixPoint,A())<n&&i.match.fn&&i.match.fn.test(I(n),h(),n,!1,c))&&!1!==(x=p(n,I(n,i.match,!0)||(null==i.match.fn?i.match.def:""!==I(n)?I(n):A()[n]),!0))&&(h().validPositions[x.pos||n].generatedInput=!0))}r=!0===r;var m=t;t.begin!==a&&(m=Z&&!u(t)?t.end:t.begin);var x=!0,w=e.extend(!0,{},h().validPositions);if(e.isFunction(c.preValidation)&&!r&&!0!==o&&!0!==l&&(x=c.preValidation(A(),m,n,u(t),c)),!0===x){if(d(m),u(t)&&(V(a,i.keyCode.DELETE,t,!0,!0),m=h().p),m<h().maskLength&&($===a||$>m)&&(x=p(m,n,r),(!r||!0===o)&&!1===x&&!0!==l)){var D=h().validPositions[m];if(!D||null!==D.match.fn||D.match.def!==n&&n!==c.skipOptionalPartCharacter){if((c.insertMode||h().validPositions[_(m)]===a)&&!M(m,!0))for(var N=m+1,F=_(m);F>=N;N++)if(!1!==(x=p(N,n,r))){!function(t,n){var i=h().validPositions[n];if(i)for(var r=i.locator,o=r.length,s=t;n>s;s++)if(h().validPositions[s]===a&&!M(s,!0)){var l=S(s).slice(),c=k(l,!0),u=-1;""===l[l.length-1].match.def&&l.pop(),e.each(l,function(e,t){for(var n=0;o>n;n++){if(t.locator[n]===a||!O(t.locator[n].toString().split(","),r[n].toString().split(","),t.na)){var i=r[n],s=c.locator[n],l=t.locator[n];i-s>Math.abs(i-l)&&(c=t);break}n>u&&(u=n,c=t)}}),c=e.extend({},c,{input:I(s,c.match,!0)||c.match.def}),c.generatedInput=!0,f(s,c,!0),h().validPositions[n]=a,p(n,i.input,!0)}}(m,x.pos!==a?x.pos:N),m=N;break}}else x={caret:_(m)}}!1===x&&c.keepStatic&&!r&&!0!==s&&(x=function(t,n,i){var r,s,l,u,p,f,d,m,y=e.extend(!0,{},h().validPositions),k=!1,b=v();for(u=h().validPositions[b];b>=0;b--)if((l=h().validPositions[b])&&l.alternation!==a){if(r=b,s=h().validPositions[r].alternation,u.locator[l.alternation]!==l.locator[l.alternation])break;u=l}if(s!==a){m=parseInt(r);var x=u.locator[u.alternation||s]!==a?u.locator[u.alternation||s]:d[0];x.length>0&&(x=x.split(",")[0]);var P=h().validPositions[m],w=h().validPositions[m-1];e.each(S(m,w?w.locator:a,m-1),function(r,l){d=l.locator[s]?l.locator[s].toString().split(","):[];for(var u=0;u<d.length;u++){var b=[],S=0,w=0,A=!1;if(x<d[u]&&(l.na===a||-1===e.inArray(d[u],l.na.split(","))||-1===e.inArray(x.toString(),d))){h().validPositions[m]=e.extend(!0,{},l);var E=h().validPositions[m].locator;for(h().validPositions[m].locator[s]=parseInt(d[u]),null==l.match.fn?(P.input!==l.match.def&&(A=!0,!0!==P.generatedInput&&b.push(P.input)),w++,h().validPositions[m].generatedInput=!/[0-9a-bA-Z]/.test(l.match.def),h().validPositions[m].input=l.match.def):h().validPositions[m].input=P.input,p=m+1;p<v(a,!0)+1;p++)f=h().validPositions[p],f&&!0!==f.generatedInput&&/[0-9a-bA-Z]/.test(f.input)?b.push(f.input):t>p&&S++,delete h().validPositions[p];for(A&&b[0]===l.match.def&&b.shift(),g(!0),k=!0;b.length>0;){var C=b.shift();if(C!==c.skipOptionalPartCharacter&&!(k=R(v(a,!0)+1,C,!1,o,!0)))break}if(k){h().validPositions[m].locator=E;var O=v(t)+1;for(p=m+1;p<v()+1;p++)((f=h().validPositions[p])===a||null==f.match.fn)&&t+(w-S)>p&&w++;t+=w-S,k=R(t>O?O:t,n,i,o,!0)}if(k)return!1;g(),h().validPositions=e.extend(!0,{},y)}}})}return k}(m,n,r)),!0===x&&(x={pos:m})}if(e.isFunction(c.postValidation)&&!1!==x&&!r&&!0!==o&&!0!==l){var T=c.postValidation(A(!0),x,c);if(T.refreshFromBuffer&&T.buffer){var B=T.refreshFromBuffer;E(!0===B?B:B.start,B.end,T.buffer)}x=!0===T?x:T}return x&&x.pos===a&&(x.pos=m),!1!==x&&!0!==l||(g(!0),h().validPositions=e.extend(!0,{},w)),x}function M(e,t){var n=b(e).match;if(""===n.def&&(n=x(e).match),null!=n.fn)return n.fn;if(!0!==t&&e>-1){var a=S(e);return a.length>1+(""===a[a.length-1].match.def?1:0)}return!1}function _(e,t){var n=h().maskLength;if(e>=n)return n;var a=e;for(S(n+1).length>1&&(m(!0,n+1,!0),n=h().maskLength);++a<n&&(!0===t&&(!0!==x(a).match.newBlockMarker||!M(a))||!0!==t&&!M(a)););return a}function D(e,t){var n,a=e;if(0>=a)return 0;for(;--a>0&&(!0===t&&!0!==x(a).match.newBlockMarker||!0!==t&&!M(a)&&(n=S(a),n.length<2||2===n.length&&""===n[1].match.def)););return a}function j(e){return h().validPositions[e]===a?I(e):h().validPositions[e].input}function N(t,n,i,r,o){if(r&&e.isFunction(c.onBeforeWrite)){var s=c.onBeforeWrite(r,n,i,c);if(s){if(s.refreshFromBuffer){var l=s.refreshFromBuffer;E(l===!0?l:l.start,l.end,s.buffer||n),n=A(!0)}i!==a&&(i=s.caret!==a?s.caret:i)}}t.inputmask._valueSet(n.join("")),i===a||r!==a&&"blur"===r.type?H(t,n,i):d&&"input"===r.type?setTimeout(function(){B(t,i)},0):B(t,i),o===!0&&(X=!0,e(t).trigger("input"))}function I(t,n,i){if(n=n||x(t).match,n.placeholder!==a||!0===i)return e.isFunction(n.placeholder)?n.placeholder(c):n.placeholder;if(null===n.fn){if(t>-1&&h().validPositions[t]===a){var r,o=S(t),s=[];if(o.length>1+(""===o[o.length-1].match.def?1:0))for(var l=0;l<o.length;l++)if(!0!==o[l].match.optionality&&!0!==o[l].match.optionalQuantifier&&(null===o[l].match.fn||r===a||!1!==o[l].match.fn.test(r.match.def,h(),t,!0,c))&&(s.push(o[l]),null===o[l].match.fn&&(r=o[l]),s.length>1&&/[0-9a-bA-Z]/.test(s[0].match.def)))return c.placeholder.charAt(t%c.placeholder.length)}return n.def}return c.placeholder.charAt(t%c.placeholder.length)}function F(t,r,o,s,l){function u(e,t){return-1!==w().slice(e,_(e)).join("").indexOf(t)&&!M(e)&&x(e).match.nativeDef===t.charAt(t.length-1)}var p=s.slice(),f="",d=-1,m=a;if(g(),o||!0===c.autoUnmask)d=_(d);else{var y=w().slice(0,_(-1)).join(""),k=p.join("").match(new RegExp("^"+i.escapeRegex(y),"g"));k&&k.length>0&&(p.splice(0,k.length*y.length),d=_(d))}if(-1===d?(h().p=_(d),d=0):h().p=d,e.each(p,function(n,i){if(i!==a)if(h().validPositions[n]===a&&p[n]===I(n)&&M(n,!0)&&!1===R(n,p[n],!0,a,a,!0))h().p++;else{var r=new e.Event("_checkval");r.which=i.charCodeAt(0),f+=i;var s=v(a,!0),l=h().validPositions[s],y=b(s+1,l?l.locator.slice():a,s);if(!u(d,f)||o||c.autoUnmask){var k=o?n:null==y.match.fn&&y.match.optionality&&s+1<h().p?s+1:h().p;m=ae.keypressEvent.call(t,r,!0,!1,o,k),d=k+1,f=""}else m=ae.keypressEvent.call(t,r,!0,!1,!0,s+1);if(!1!==m&&!o&&e.isFunction(c.onBeforeWrite)){var x=m;if(m=c.onBeforeWrite.call(q,r,A(),m.forwardPosition,c),(m=e.extend(x,m))&&m.refreshFromBuffer){var P=m.refreshFromBuffer;E(!0===P?P:P.start,P.end,m.buffer),g(!0),m.caret&&(h().p=m.caret,m.forwardPosition=m.caret)}}}}),r){var P=a;n.activeElement===t&&m&&(P=c.numericInput?D(m.forwardPosition):m.forwardPosition),N(t,A(),P,l||new e.Event("checkval"),l&&"input"===l.type)}}function T(t){if(t){if(t.inputmask===a)return t.value;t.inputmask&&t.inputmask.refreshValue&&ae.setValueEvent.call(t)}var n=[],i=h().validPositions;for(var r in i)i[r].match&&null!=i[r].match.fn&&n.push(i[r].input);var o=0===n.length?"":(Z?n.reverse():n).join("");if(e.isFunction(c.onUnMask)){var s=(Z?A().slice().reverse():A()).join("");o=c.onUnMask.call(q,s,o,c)}return o}function B(e,i,r,o){function s(e){return!0===o||!Z||"number"!=typeof e||c.greedy&&""===c.placeholder||(e=A().join("").length-e),e}var l;if(i===a)return e.setSelectionRange?(i=e.selectionStart,r=e.selectionEnd):t.getSelection?(l=t.getSelection().getRangeAt(0),l.commonAncestorContainer.parentNode!==e&&l.commonAncestorContainer!==e||(i=l.startOffset,r=l.endOffset)):n.selection&&n.selection.createRange&&(l=n.selection.createRange(),i=0-l.duplicate().moveStart("character",-e.inputmask._valueGet().length),r=i+l.text.length),{begin:s(i),end:s(r)};if(i.begin!==a&&(r=i.end,i=i.begin),"number"==typeof i){i=s(i),r=s(r),r="number"==typeof r?r:i;var p=parseInt(((e.ownerDocument.defaultView||t).getComputedStyle?(e.ownerDocument.defaultView||t).getComputedStyle(e,null):e.currentStyle).fontSize)*r;if(e.scrollLeft=p>e.scrollWidth?p:0,u||!1!==c.insertMode||i!==r||r++,e.setSelectionRange)e.selectionStart=i,e.selectionEnd=r;else if(t.getSelection){if(l=n.createRange(),e.firstChild===a||null===e.firstChild){var f=n.createTextNode("");e.appendChild(f)}l.setStart(e.firstChild,i<e.inputmask._valueGet().length?i:e.inputmask._valueGet().length),l.setEnd(e.firstChild,r<e.inputmask._valueGet().length?r:e.inputmask._valueGet().length),l.collapse(!0);var d=t.getSelection();d.removeAllRanges(),d.addRange(l)}else e.createTextRange&&(l=e.createTextRange(),l.collapse(!0),l.moveEnd("character",r),l.moveStart("character",i),l.select());H(e,{begin:i,end:r})}}function G(t){var n,i,r=A(),o=r.length,s=v(),l={},c=h().validPositions[s],u=c!==a?c.locator.slice():a;for(n=s+1;n<r.length;n++)i=b(n,u,n-1),u=i.locator.slice(),l[n]=e.extend(!0,{},i);var p=c&&c.alternation!==a?c.locator[c.alternation]:a;for(n=o-1;n>s&&(i=l[n],(i.match.optionality||i.match.optionalQuantifier&&i.match.newBlockMarker||p&&(p!==l[n].locator[c.alternation]&&null!=i.match.fn||null===i.match.fn&&i.locator[c.alternation]&&O(i.locator[c.alternation].toString().split(","),p.toString().split(","))&&""!==S(n)[0].def))&&r[n]===I(n,i.match));n--)o--;return t?{l:o,def:l[o]?l[o].match:a}:o}function L(e){for(var t,n=G(),i=e.length,r=h().validPositions[v()];i>n&&!M(n,!0)&&(t=r!==a?b(n,r.locator.slice(""),r):x(n))&&!0!==t.match.optionality&&(!0!==t.match.optionalQuantifier&&!0!==t.match.newBlockMarker||n+1===i&&""===(r!==a?b(n+1,r.locator.slice(""),r):x(n+1)).match.def);)n++;for(;(t=h().validPositions[n-1])&&t&&t.match.optionality&&t.input===c.skipOptionalPartCharacter;)n--;return e.splice(n),e}function U(t){if(e.isFunction(c.isComplete))return c.isComplete(t,c);if("*"===c.repeat)return a;var n=!1,i=G(!0),r=D(i.l);if(i.def===a||i.def.newBlockMarker||i.def.optionality||i.def.optionalQuantifier){n=!0;for(var o=0;r>=o;o++){var s=b(o).match;if(null!==s.fn&&h().validPositions[o]===a&&!0!==s.optionality&&!0!==s.optionalQuantifier||null===s.fn&&t[o]!==I(o,s)){n=!1;break}}}return n}function V(t,n,r,o,s){if((c.numericInput||Z)&&(n===i.keyCode.BACKSPACE?n=i.keyCode.DELETE:n===i.keyCode.DELETE&&(n=i.keyCode.BACKSPACE),Z)){var l=r.end;r.end=r.begin,r.begin=l}n===i.keyCode.BACKSPACE&&(r.end-r.begin<1||!1===c.insertMode)?(r.begin=D(r.begin),h().validPositions[r.begin]!==a&&h().validPositions[r.begin].input===c.groupSeparator&&r.begin--):n===i.keyCode.DELETE&&r.begin===r.end&&(r.end=M(r.end,!0)&&h().validPositions[r.end]&&h().validPositions[r.end].input!==c.radixPoint?r.end+1:_(r.end)+1,h().validPositions[r.begin]!==a&&h().validPositions[r.begin].input===c.groupSeparator&&r.end++),y(r.begin,r.end,!1,o),!0!==o&&function(){if(c.keepStatic){for(var n=[],i=v(-1,!0),r=e.extend(!0,{},h().validPositions),o=h().validPositions[i];i>=0;i--){var s=h().validPositions[i];if(s){if(!0!==s.generatedInput&&/[0-9a-bA-Z]/.test(s.input)&&n.push(s.input),delete h().validPositions[i],s.alternation!==a&&s.locator[s.alternation]!==o.locator[s.alternation])break;o=s}}if(i>-1)for(h().p=_(v(-1,!0));n.length>0;){var l=new e.Event("keypress");l.which=n.pop().charCodeAt(0),ae.keypressEvent.call(t,l,!0,!1,!1,h().p)}else h().validPositions=e.extend(!0,{},r)}}();var u=v(r.begin,!0);if(u<r.begin)h().p=_(u);else if(!0!==o&&(h().p=r.begin,!0!==s))for(;h().p<u&&h().validPositions[h().p]===a;)h().p++}function K(a){function i(e){var t,i=n.createElement("span");for(var o in r)isNaN(o)&&-1!==o.indexOf("font")&&(i.style[o]=r[o]);i.style.textTransform=r.textTransform,i.style.letterSpacing=r.letterSpacing,i.style.position="absolute",i.style.height="auto",i.style.width="auto",i.style.visibility="hidden",i.style.whiteSpace="nowrap",n.body.appendChild(i);var s,l=a.inputmask._valueGet(),c=0;for(t=0,s=l.length;s>=t;t++){if(i.innerHTML+=l.charAt(t)||"_",i.offsetWidth>=e){var u=e-c,p=i.offsetWidth-e;i.innerHTML=l.charAt(t),u-=i.offsetWidth/3,t=p>u?t-1:t;break}c=i.offsetWidth}return n.body.removeChild(i),t}var r=(a.ownerDocument.defaultView||t).getComputedStyle(a,null),o=n.createElement("div");o.style.width=r.width,o.style.textAlign=r.textAlign,Q=n.createElement("div"),Q.className="im-colormask",a.parentNode.insertBefore(Q,a),a.parentNode.removeChild(a),Q.appendChild(o),Q.appendChild(a),a.style.left=o.offsetLeft+"px",e(a).on("click",function(e){return B(a,i(e.clientX)),ae.clickEvent.call(a,[e])}),e(a).on("keydown",function(e){e.shiftKey||!1===c.insertMode||setTimeout(function(){H(a)},0)})}function H(e,t,i){function r(){f||null!==s.fn&&l.input!==a?f&&(null!==s.fn&&l.input!==a||""===s.def)&&(f=!1,p+="</span>"):(f=!0,p+="<span class='im-static'>")}function o(a){!0!==a&&d!==t.begin||n.activeElement!==e||(p+="<span class='im-caret' style='border-right-width: 1px;border-right-style: solid;'></span>")}var s,l,u,p="",f=!1,d=0;if(Q!==a){var m=A();if(t===a?t=B(e):t.begin===a&&(t={begin:t,end:t}),!0!==i){var g=v();do o(),h().validPositions[d]?(l=h().validPositions[d],s=l.match,u=l.locator.slice(),r(),p+=m[d]):(l=b(d,u,d-1),s=l.match,u=l.locator.slice(),(!1===c.jitMasking||g>d||"number"==typeof c.jitMasking&&isFinite(c.jitMasking)&&c.jitMasking>d)&&(r(),p+=I(d,s))),d++;while(($===a||$>d)&&(null!==s.fn||""!==s.def)||g>d||f);-1===p.indexOf("im-caret")&&o(!0),f&&r()}var y=Q.getElementsByTagName("div")[0];y.innerHTML=p,e.inputmask.positionColorMask(e,y)}}s=s||this.maskset,c=c||this.opts;var z,W,$,Q,q=this,Y=this.el,Z=this.isRTL,J=!1,X=!1,ee=!1,te=!1,ne={on:function(t,n,r){var o=function(t){if(this.inputmask===a&&"FORM"!==this.nodeName){var n=e.data(this,"_inputmask_opts");n?new i(n).mask(this):ne.off(this)}else{if("setvalue"===t.type||"FORM"===this.nodeName||!(this.disabled||this.readOnly&&!("keydown"===t.type&&t.ctrlKey&&67===t.keyCode||!1===c.tabThrough&&t.keyCode===i.keyCode.TAB))){switch(t.type){case"input":if(!0===X)return X=!1,t.preventDefault();break;case"keydown":J=!1,X=!1;break;case"keypress":if(!0===J)return t.preventDefault();J=!0;break;case"click":if(p||f){var o=this,s=arguments;return setTimeout(function(){r.apply(o,s)},0),!1}}var l=r.apply(this,arguments);return!1===l&&(t.preventDefault(),t.stopPropagation()),l}t.preventDefault()}};t.inputmask.events[n]=t.inputmask.events[n]||[],t.inputmask.events[n].push(o),-1!==e.inArray(n,["submit","reset"])?null!==t.form&&e(t.form).on(n,o):e(t).on(n,o)},off:function(t,n){if(t.inputmask&&t.inputmask.events){var a;n?(a=[],a[n]=t.inputmask.events[n]):a=t.inputmask.events,e.each(a,function(n,a){for(;a.length>0;){var i=a.pop();-1!==e.inArray(n,["submit","reset"])?null!==t.form&&e(t.form).off(n,i):e(t).off(n,i)}delete t.inputmask.events[n]})}}},ae={keydownEvent:function(t){var a=this,r=e(a),o=t.keyCode,s=B(a);if(o===i.keyCode.BACKSPACE||o===i.keyCode.DELETE||f&&o===i.keyCode.BACKSPACE_SAFARI||t.ctrlKey&&o===i.keyCode.X&&!function(e){var t=n.createElement("input"),a="on"+e,i=a in t;return i||(t.setAttribute(a,"return;"),i="function"==typeof t[a]),t=null,i}("cut"))t.preventDefault(),V(a,o,s),N(a,A(!0),h().p,t,a.inputmask._valueGet()!==A().join("")),a.inputmask._valueGet()===w().join("")?r.trigger("cleared"):!0===U(A())&&r.trigger("complete");else if(o===i.keyCode.END||o===i.keyCode.PAGE_DOWN){t.preventDefault();var l=_(v());c.insertMode||l!==h().maskLength||t.shiftKey||l--,B(a,t.shiftKey?s.begin:l,l,!0)}else o===i.keyCode.HOME&&!t.shiftKey||o===i.keyCode.PAGE_UP?(t.preventDefault(),B(a,0,t.shiftKey?s.begin:0,!0)):(c.undoOnEscape&&o===i.keyCode.ESCAPE||90===o&&t.ctrlKey)&&!0!==t.altKey?(F(a,!0,!1,z.split("")),r.trigger("click")):o!==i.keyCode.INSERT||t.shiftKey||t.ctrlKey?!0===c.tabThrough&&o===i.keyCode.TAB?(!0===t.shiftKey?(null===x(s.begin).match.fn&&(s.begin=_(s.begin)),s.end=D(s.begin,!0),s.begin=D(s.end,!0)):(s.begin=_(s.begin,!0),s.end=_(s.begin,!0),s.end<h().maskLength&&s.end--),s.begin<h().maskLength&&(t.preventDefault(),B(a,s.begin,s.end))):t.shiftKey||!1===c.insertMode&&(o===i.keyCode.RIGHT?setTimeout(function(){var e=B(a);B(a,e.begin)},0):o===i.keyCode.LEFT&&setTimeout(function(){var e=B(a);B(a,Z?e.begin+1:e.begin-1)},0)):(c.insertMode=!c.insertMode,B(a,c.insertMode||s.begin!==h().maskLength?s.begin:s.begin-1));c.onKeyDown.call(this,t,A(),B(a).begin,c),ee=-1!==e.inArray(o,c.ignorables)},keypressEvent:function(t,n,a,r,o){var s=this,l=e(s),u=t.which||t.charCode||t.keyCode;if(!(n===!0||t.ctrlKey&&t.altKey)&&(t.ctrlKey||t.metaKey||ee))return u===i.keyCode.ENTER&&z!==A().join("")&&(z=A().join(""),setTimeout(function(){l.trigger("change")},0)),!0;if(u){46===u&&t.shiftKey===!1&&""!==c.radixPoint&&(u=c.radixPoint.charCodeAt(0));var p,f=n?{begin:o,end:o}:B(s),m=String.fromCharCode(u);h().writeOutBuffer=!0;var v=R(f,m,r);if(v!==!1&&(g(!0),p=void 0!==v.caret?v.caret:n?v.pos+1:_(v.pos),h().p=p),a!==!1){var y=this;if(setTimeout(function(){c.onKeyValidation.call(y,u,v,c)},0),h().writeOutBuffer&&v!==!1){var k=A();N(s,k,c.numericInput&&void 0===v.caret?D(p):p,t,n!==!0),n!==!0&&setTimeout(function(){U(k)===!0&&l.trigger("complete")},0)}if(d&&l.is(":focus")){var b=_(v.pos);b>0&&setTimeout(function(){B(s,b)},0)}}if(t.preventDefault(),n)return v.forwardPosition=p,v}},pasteEvent:function(n){var a,i=this,r=n.originalEvent||n,o=e(i),s=i.inputmask._valueGet(!0),l=B(i);Z&&(a=l.end,l.end=l.begin,l.begin=a);var u=s.substr(0,l.begin),p=s.substr(l.end,s.length);if(u===(Z?w().reverse():w()).slice(0,l.begin).join("")&&(u=""),p===(Z?w().reverse():w()).slice(l.end).join("")&&(p=""),Z&&(a=u,u=p,p=a),t.clipboardData&&t.clipboardData.getData)s=u+t.clipboardData.getData("Text")+p;else{if(!r.clipboardData||!r.clipboardData.getData)return!0;s=u+r.clipboardData.getData("text/plain")+p}var f=s;if(e.isFunction(c.onBeforePaste)){if(!1===(f=c.onBeforePaste.call(q,s,c)))return n.preventDefault();f||(f=s)}return F(i,!1,!1,Z?f.split("").reverse():f.toString().split("")),N(i,A(),_(v()),n,z!==A().join("")),!0===U(A())&&o.trigger("complete"),n.preventDefault()},inputFallBackEvent:function(t){var n=this,a=n.inputmask._valueGet();if(A().join("")!==a){var r=B(n);if(!1===function(t,n,a){if("."===n.charAt(a.begin-1)&&""!==c.radixPoint&&(n=n.split(""),n[a.begin-1]=c.radixPoint.charAt(0),n=n.join("")),n.charAt(a.begin-1)===c.radixPoint&&n.length>A().length){var i=new e.Event("keypress");return i.which=c.radixPoint.charCodeAt(0),ae.keypressEvent.call(t,i,!0,!0,!1,a.begin-1),!1}}(n,a,r))return!1;if(a=a.replace(new RegExp("("+i.escapeRegex(w().join(""))+")*"),""),!1===function(t,n,a){if(p){var i=n.replace(A().join(""),"");if(1===i.length){var r=new e.Event("keypress");return r.which=i.charCodeAt(0),
ae.keypressEvent.call(t,r,!0,!0,!1,h().validPositions[a.begin-1]?a.begin:a.begin-1),!1}}}(n,a,r))return!1;r.begin>a.length&&(B(n,a.length),r=B(n));var o=A().join(""),s=a.substr(0,r.begin),l=a.substr(r.begin),u=o.substr(0,r.begin),f=o.substr(r.begin),m=r,g=0;if(l===f||s===u){if(m={begin:s.length},s[s.length-1]!==u[u.length-1]&&(m.begin--,g++),l.length>f.length)m.end=m.begin;else{var y=f.replace(new RegExp(i.escapeRegex(l)+"$"),"");m.end=m.begin+y.length+g}m.begin!==m.end||M(m.begin)||(m.end=r.end)}if(m.begin<m.end)N(n,A(),m),s.split("")[s.length-1]!==u.split("")[u.length-1]?(t.which=s.charCodeAt(s.length-1),ee=!1,ae.keypressEvent.call(n,t)):(m.begin===m.end-1&&B(n,D(m.begin+1),m.end),t.keyCode=i.keyCode.DELETE,ae.keydownEvent.call(n,t));else{if(-1===v()){for(var k=w().join("");null===a.match(i.escapeRegex(k)+"$");)k=k.slice(1);a=a.replace(k,"")}e.isFunction(c.onBeforeMask)&&(a=c.onBeforeMask.call(q,a,c)||a),F(n,!0,!1,a.split(""),t),function(e,t,n){var a=B(e).begin,r=e.inputmask._valueGet(),o=r.indexOf(t),s=a;if(0===o&&a!==t.length)a=t.length;else{for(;null===r.match(i.escapeRegex(n)+"$");)n=n.substr(1);var l=r.indexOf(n);-1!==l&&""!==n&&a>l&&l>o&&(a=l)}M(a)||(a=_(a)),s!==a&&(B(e,a),d&&setTimeout(function(){B(e,a)},0))}(n,s,l),!0===U(A())&&e(n).trigger("complete")}t.preventDefault()}},setValueEvent:function(){this.inputmask.refreshValue=!1;var t=this,n=t.inputmask._valueGet(!0);e.isFunction(c.onBeforeMask)&&(n=c.onBeforeMask.call(q,n,c)||n),n=n.split(""),F(t,!0,!1,Z?n.reverse():n),z=A().join(""),(c.clearMaskOnLostFocus||c.clearIncomplete)&&t.inputmask._valueGet()===w().join("")&&t.inputmask._valueSet("")},focusEvent:function(e){var t=this,n=t.inputmask._valueGet();c.showMaskOnFocus&&(!c.showMaskOnHover||c.showMaskOnHover&&""===n)&&(t.inputmask._valueGet()!==A().join("")?N(t,A(),_(v())):!1===te&&B(t,_(v()))),!0===c.positionCaretOnTab&&!1===te&&""!==n&&(N(t,A(),B(t)),ae.clickEvent.apply(t,[e,!0])),z=A().join("")},mouseleaveEvent:function(){var e=this;if(te=!1,c.clearMaskOnLostFocus&&n.activeElement!==e){var t=A().slice(),a=e.inputmask._valueGet();a!==e.getAttribute("placeholder")&&""!==a&&(-1===v()&&a===w().join("")?t=[]:L(t),N(e,t))}},clickEvent:function(t,i){function r(t){if(""!==c.radixPoint){var n=h().validPositions;if(n[t]===a||n[t].input===I(t)){if(t<_(-1))return!0;var i=e.inArray(c.radixPoint,A());if(-1!==i){for(var r in n)if(r>i&&n[r].input!==I(r))return!1;return!0}}}return!1}var o=this;setTimeout(function(){if(n.activeElement===o){var e=B(o);if(i&&(Z?e.end=e.begin:e.begin=e.end),e.begin===e.end)switch(c.positionCaretOnClick){case"none":break;case"radixFocus":if(r(e.begin)){var t=A().join("").indexOf(c.radixPoint);B(o,c.numericInput?_(t):t);break}default:var s=e.begin,l=v(s,!0),u=_(l);if(u>s)B(o,M(s,!0)||M(s-1,!0)?s:_(s));else{var p=h().validPositions[l],f=b(u,p?p.match.locator:a,p),d=I(u,f.match);if(""!==d&&A()[u]!==d&&!0!==f.match.optionalQuantifier&&!0!==f.match.newBlockMarker||!M(u,!0)&&f.match.def===d){var m=_(u);(s>=m||s===u)&&(u=m)}B(o,u)}}}},0)},dblclickEvent:function(){var e=this;setTimeout(function(){B(e,0,_(v()))},0)},cutEvent:function(a){var r=this,o=e(r),s=B(r),l=a.originalEvent||a,c=t.clipboardData||l.clipboardData,u=Z?A().slice(s.end,s.begin):A().slice(s.begin,s.end);c.setData("text",Z?u.reverse().join(""):u.join("")),n.execCommand&&n.execCommand("copy"),V(r,i.keyCode.DELETE,s),N(r,A(),h().p,a,z!==A().join("")),r.inputmask._valueGet()===w().join("")&&o.trigger("cleared")},blurEvent:function(t){var n=e(this),i=this;if(i.inputmask){var r=i.inputmask._valueGet(),o=A().slice();""!==r&&(c.clearMaskOnLostFocus&&(-1===v()&&r===w().join("")?o=[]:L(o)),!1===U(o)&&(setTimeout(function(){n.trigger("incomplete")},0),c.clearIncomplete&&(g(),o=c.clearMaskOnLostFocus?[]:w().slice())),N(i,o,a,t)),z!==A().join("")&&(z=o.join(""),n.trigger("change"))}},mouseenterEvent:function(){var e=this;te=!0,n.activeElement!==e&&c.showMaskOnHover&&e.inputmask._valueGet()!==A().join("")&&N(e,A())},submitEvent:function(){z!==A().join("")&&W.trigger("change"),c.clearMaskOnLostFocus&&-1===v()&&Y.inputmask._valueGet&&Y.inputmask._valueGet()===w().join("")&&Y.inputmask._valueSet(""),c.removeMaskOnSubmit&&(Y.inputmask._valueSet(Y.inputmask.unmaskedvalue(),!0),setTimeout(function(){N(Y,A())},0))},resetEvent:function(){Y.inputmask.refreshValue=!0,setTimeout(function(){W.trigger("setvalue")},0)}};i.prototype.positionColorMask=function(e,t){e.style.left=t.offsetLeft+"px"};var ie;if(r!==a)switch(r.action){case"isComplete":return Y=r.el,U(A());case"unmaskedvalue":return Y!==a&&r.value===a||(ie=r.value,ie=(e.isFunction(c.onBeforeMask)?c.onBeforeMask.call(q,ie,c)||ie:ie).split(""),F(a,!1,!1,Z?ie.reverse():ie),e.isFunction(c.onBeforeWrite)&&c.onBeforeWrite.call(q,a,A(),0,c)),T(Y);case"mask":!function(t){ne.off(t);var i=function(t,i){var r=t.getAttribute("type"),s="INPUT"===t.tagName&&-1!==e.inArray(r,i.supportsInputType)||t.isContentEditable||"TEXTAREA"===t.tagName;if(!s)if("INPUT"===t.tagName){var l=n.createElement("input");l.setAttribute("type",r),s="text"===l.type,l=null}else s="partial";return!1!==s?function(t){function r(){return this.inputmask?this.inputmask.opts.autoUnmask?this.inputmask.unmaskedvalue():-1!==v()||!0!==i.nullable?n.activeElement===this&&i.clearMaskOnLostFocus?(Z?L(A().slice()).reverse():L(A().slice())).join(""):l.call(this):"":l.call(this)}function s(t){c.call(this,t),this.inputmask&&e(this).trigger("setvalue")}var l,c;if(!t.inputmask.__valueGet){if(!0!==i.noValuePatching){if(Object.getOwnPropertyDescriptor){"function"!=typeof Object.getPrototypeOf&&(Object.getPrototypeOf="object"===o("test".__proto__)?function(e){return e.__proto__}:function(e){return e.constructor.prototype});var u=Object.getPrototypeOf?Object.getOwnPropertyDescriptor(Object.getPrototypeOf(t),"value"):a;u&&u.get&&u.set?(l=u.get,c=u.set,Object.defineProperty(t,"value",{get:r,set:s,configurable:!0})):"INPUT"!==t.tagName&&(l=function(){return this.textContent},c=function(e){this.textContent=e},Object.defineProperty(t,"value",{get:r,set:s,configurable:!0}))}else n.__lookupGetter__&&t.__lookupGetter__("value")&&(l=t.__lookupGetter__("value"),c=t.__lookupSetter__("value"),t.__defineGetter__("value",r),t.__defineSetter__("value",s));t.inputmask.__valueGet=l,t.inputmask.__valueSet=c}t.inputmask._valueGet=function(e){return Z&&!0!==e?l.call(this.el).split("").reverse().join(""):l.call(this.el)},t.inputmask._valueSet=function(e,t){c.call(this.el,null===e||e===a?"":!0!==t&&Z?e.split("").reverse().join(""):e)},l===a&&(l=function(){return this.value},c=function(e){this.value=e},function(t){if(e.valHooks&&(e.valHooks[t]===a||!0!==e.valHooks[t].inputmaskpatch)){var n=e.valHooks[t]&&e.valHooks[t].get?e.valHooks[t].get:function(e){return e.value},r=e.valHooks[t]&&e.valHooks[t].set?e.valHooks[t].set:function(e,t){return e.value=t,e};e.valHooks[t]={get:function(e){if(e.inputmask){if(e.inputmask.opts.autoUnmask)return e.inputmask.unmaskedvalue();var t=n(e);return-1!==v(a,a,e.inputmask.maskset.validPositions)||!0!==i.nullable?t:""}return n(e)},set:function(t,n){var a,i=e(t);return a=r(t,n),t.inputmask&&i.trigger("setvalue"),a},inputmaskpatch:!0}}}(t.type),function(t){ne.on(t,"mouseenter",function(){var t=e(this);this.inputmask._valueGet()!==A().join("")&&t.trigger("setvalue")})}(t))}}(t):t.inputmask=a,s}(t,c);if(!1!==i&&(Y=t,W=e(Y),$=Y!==a?Y.maxLength:a,-1===$&&($=a),!0===c.colorMask&&K(Y),d&&(Y.hasOwnProperty("inputmode")&&(Y.inputmode=c.inputmode,Y.setAttribute("inputmode",c.inputmode)),"rtfm"===c.androidHack&&(!0!==c.colorMask&&K(Y),Y.type="password")),!0===i&&(ne.on(Y,"submit",ae.submitEvent),ne.on(Y,"reset",ae.resetEvent),ne.on(Y,"mouseenter",ae.mouseenterEvent),ne.on(Y,"blur",ae.blurEvent),ne.on(Y,"focus",ae.focusEvent),ne.on(Y,"mouseleave",ae.mouseleaveEvent),!0!==c.colorMask&&ne.on(Y,"click",ae.clickEvent),ne.on(Y,"dblclick",ae.dblclickEvent),ne.on(Y,"paste",ae.pasteEvent),ne.on(Y,"dragdrop",ae.pasteEvent),ne.on(Y,"drop",ae.pasteEvent),ne.on(Y,"cut",ae.cutEvent),ne.on(Y,"complete",c.oncomplete),ne.on(Y,"incomplete",c.onincomplete),ne.on(Y,"cleared",c.oncleared),d||!0===c.inputEventOnly?Y.removeAttribute("maxLength"):(ne.on(Y,"keydown",ae.keydownEvent),ne.on(Y,"keypress",ae.keypressEvent)),ne.on(Y,"compositionstart",e.noop),ne.on(Y,"compositionupdate",e.noop),ne.on(Y,"compositionend",e.noop),ne.on(Y,"keyup",e.noop),ne.on(Y,"input",ae.inputFallBackEvent),ne.on(Y,"beforeinput",e.noop)),ne.on(Y,"setvalue",ae.setValueEvent),z=w().join(""),""!==Y.inputmask._valueGet(!0)||!1===c.clearMaskOnLostFocus||n.activeElement===Y)){var r=e.isFunction(c.onBeforeMask)?c.onBeforeMask.call(q,Y.inputmask._valueGet(!0),c)||Y.inputmask._valueGet(!0):Y.inputmask._valueGet(!0);""!==r&&F(Y,!0,!1,Z?r.split("").reverse():r.split(""));var s=A().slice();z=s.join(""),!1===U(s)&&c.clearIncomplete&&g(),c.clearMaskOnLostFocus&&n.activeElement!==Y&&(-1===v()?s=[]:L(s)),N(Y,s),n.activeElement===Y&&B(Y,_(v()))}}(Y);break;case"format":return ie=(e.isFunction(c.onBeforeMask)?c.onBeforeMask.call(q,r.value,c)||r.value:r.value).split(""),F(a,!0,!1,Z?ie.reverse():ie),r.metadata?{value:Z?A().slice().reverse().join(""):A().join(""),metadata:l.call(this,{action:"getmetadata"},s,c)}:Z?A().slice().reverse().join(""):A().join("");case"isValid":r.value?(ie=r.value.split(""),F(a,!0,!0,Z?ie.reverse():ie)):r.value=A().join("");for(var re=A(),oe=G(),se=re.length-1;se>oe&&!M(se);se--);return re.splice(oe,se+1-oe),U(re)&&r.value===A().join("");case"getemptymask":return w().join("");case"remove":return Y&&Y.inputmask&&(W=e(Y),Y.inputmask._valueSet(c.autoUnmask?T(Y):Y.inputmask._valueGet(!0)),ne.off(Y),Object.getOwnPropertyDescriptor&&Object.getPrototypeOf?Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Y),"value")&&Y.inputmask.__valueGet&&Object.defineProperty(Y,"value",{get:Y.inputmask.__valueGet,set:Y.inputmask.__valueSet,configurable:!0}):n.__lookupGetter__&&Y.__lookupGetter__("value")&&Y.inputmask.__valueGet&&(Y.__defineGetter__("value",Y.inputmask.__valueGet),Y.__defineSetter__("value",Y.inputmask.__valueSet)),Y.inputmask=a),Y;case"getmetadata":if(e.isArray(s.metadata)){var le=m(!0,0,!1).join("");return e.each(s.metadata,function(e,t){return t.mask===le?(le=t,!1):void 0}),le}return s.metadata}}var c=navigator.userAgent,u=/mobile/i.test(c),p=/iemobile/i.test(c),f=/iphone/i.test(c)&&!p,d=/android/i.test(c)&&!p;return i.prototype={dataAttribute:"data-inputmask",defaults:{placeholder:"_",optionalmarker:{start:"[",end:"]"},quantifiermarker:{start:"{",end:"}"},groupmarker:{start:"(",end:")"},alternatormarker:"|",escapeChar:"\\",mask:null,regex:null,oncomplete:e.noop,onincomplete:e.noop,oncleared:e.noop,repeat:0,greedy:!0,autoUnmask:!1,removeMaskOnSubmit:!1,clearMaskOnLostFocus:!0,insertMode:!0,clearIncomplete:!1,alias:null,onKeyDown:e.noop,onBeforeMask:null,onBeforePaste:function(t,n){return e.isFunction(n.onBeforeMask)?n.onBeforeMask.call(this,t,n):t},onBeforeWrite:null,onUnMask:null,showMaskOnFocus:!0,showMaskOnHover:!0,onKeyValidation:e.noop,skipOptionalPartCharacter:" ",numericInput:!1,rightAlign:!1,undoOnEscape:!0,radixPoint:"",radixPointDefinitionSymbol:a,groupSeparator:"",keepStatic:null,positionCaretOnTab:!0,tabThrough:!1,supportsInputType:["text","tel","password"],ignorables:[8,9,13,19,27,33,34,35,36,37,38,39,40,45,46,93,112,113,114,115,116,117,118,119,120,121,122,123,0,229],isComplete:null,canClearPosition:e.noop,preValidation:null,postValidation:null,staticDefinitionSymbol:a,jitMasking:!1,nullable:!0,inputEventOnly:!1,noValuePatching:!1,positionCaretOnClick:"lvp",casing:null,inputmode:"verbatim",colorMask:!1,androidHack:!1,importDataAttributes:!0},definitions:{9:{validator:"[0-9]",cardinality:1,definitionSymbol:"*"},a:{validator:"[A-Za-zА-яЁёÀ-ÿµ]",cardinality:1,definitionSymbol:"*"},"*":{validator:"[0-9A-Za-zА-яЁёÀ-ÿµ]",cardinality:1}},aliases:{},masksCache:{},mask:function(o){function c(n,i,o,s){if(!0===i.importDataAttributes){var l,c,u,p,f=function(e,i){null!==(i=i!==a?i:n.getAttribute(s+"-"+e))&&("string"==typeof i&&(0===e.indexOf("on")?i=t[i]:"false"===i?i=!1:"true"===i&&(i=!0)),o[e]=i)},d=n.getAttribute(s);if(d&&""!==d&&(d=d.replace(new RegExp("'","g"),'"'),c=JSON.parse("{"+d+"}")),c){u=a;for(p in c)if("alias"===p.toLowerCase()){u=c[p];break}}f("alias",u),o.alias&&r(o.alias,o,i);for(l in i){if(c){u=a;for(p in c)if(p.toLowerCase()===l.toLowerCase()){u=c[p];break}}f(l,u)}}return e.extend(!0,i,o),("rtl"===n.dir||i.rightAlign)&&(n.style.textAlign="right"),("rtl"===n.dir||i.numericInput)&&(n.dir="ltr",n.removeAttribute("dir"),i.isRTL=!0),i}var u=this;return"string"==typeof o&&(o=n.getElementById(o)||n.querySelectorAll(o)),o=o.nodeName?[o]:o,e.each(o,function(t,n){var r=e.extend(!0,{},u.opts);c(n,r,e.extend(!0,{},u.userOptions),u.dataAttribute);var o=s(r,u.noMasksCache);o!==a&&(n.inputmask!==a&&n.inputmask.remove(),n.inputmask=new i(a,a,!0),n.inputmask.opts=r,n.inputmask.noMasksCache=u.noMasksCache,n.inputmask.userOptions=e.extend(!0,{},u.userOptions),n.inputmask.isRTL=r.isRTL||r.numericInput,n.inputmask.el=n,n.inputmask.maskset=o,e.data(n,"_inputmask_opts",r),l.call(n.inputmask,{action:"mask"}))}),o&&o[0]?o[0].inputmask||this:this},option:function(t,n){return"string"==typeof t?this.opts[t]:"object"===(void 0===t?"undefined":o(t))?(e.extend(this.userOptions,t),this.el&&!0!==n&&this.mask(this.el),this):void 0},unmaskedvalue:function(e){return this.maskset=this.maskset||s(this.opts,this.noMasksCache),l.call(this,{action:"unmaskedvalue",value:e})},remove:function(){return l.call(this,{action:"remove"})},getemptymask:function(){return this.maskset=this.maskset||s(this.opts,this.noMasksCache),l.call(this,{action:"getemptymask"})},hasMaskedValue:function(){return!this.opts.autoUnmask},isComplete:function(){return this.maskset=this.maskset||s(this.opts,this.noMasksCache),l.call(this,{action:"isComplete"})},getmetadata:function(){return this.maskset=this.maskset||s(this.opts,this.noMasksCache),l.call(this,{action:"getmetadata"})},isValid:function(e){return this.maskset=this.maskset||s(this.opts,this.noMasksCache),l.call(this,{action:"isValid",value:e})},format:function(e,t){return this.maskset=this.maskset||s(this.opts,this.noMasksCache),l.call(this,{action:"format",value:e,metadata:t})},analyseMask:function(t,n,r){function o(e,t,n,a){this.matches=[],this.openGroup=e||!1,this.alternatorGroup=!1,this.isGroup=e||!1,this.isOptional=t||!1,this.isQuantifier=n||!1,this.isAlternator=a||!1,this.quantifier={min:1,max:1}}function s(t,o,s){s=s!==a?s:t.matches.length;var l=t.matches[s-1];if(n)0===o.indexOf("[")||b&&/\\d|\\s|\\w]/i.test(o)||"."===o?t.matches.splice(s++,0,{fn:new RegExp(o,r.casing?"i":""),cardinality:1,optionality:t.isOptional,newBlockMarker:l===a||l.def!==o,casing:null,def:o,placeholder:a,nativeDef:o}):(b&&(o=o[o.length-1]),e.each(o.split(""),function(e,n){l=t.matches[s-1],t.matches.splice(s++,0,{fn:null,cardinality:0,optionality:t.isOptional,newBlockMarker:l===a||l.def!==n&&null!==l.fn,casing:null,def:r.staticDefinitionSymbol||n,placeholder:r.staticDefinitionSymbol!==a?n:a,nativeDef:n})})),b=!1;else{var c=(r.definitions?r.definitions[o]:a)||i.prototype.definitions[o];if(c&&!b){for(var u=c.prevalidator,p=u?u.length:0,f=1;f<c.cardinality;f++){var d=p>=f?u[f-1]:[],m=d.validator,h=d.cardinality;t.matches.splice(s++,0,{fn:m?"string"==typeof m?new RegExp(m,r.casing?"i":""):new function(){this.test=m}:new RegExp("."),cardinality:h||1,optionality:t.isOptional,newBlockMarker:l===a||l.def!==(c.definitionSymbol||o),casing:c.casing,def:c.definitionSymbol||o,placeholder:c.placeholder,nativeDef:o}),l=t.matches[s-1]}t.matches.splice(s++,0,{fn:c.validator?"string"==typeof c.validator?new RegExp(c.validator,r.casing?"i":""):new function(){this.test=c.validator}:new RegExp("."),cardinality:c.cardinality,optionality:t.isOptional,newBlockMarker:l===a||l.def!==(c.definitionSymbol||o),casing:c.casing,def:c.definitionSymbol||o,placeholder:c.placeholder,nativeDef:o})}else t.matches.splice(s++,0,{fn:null,cardinality:0,optionality:t.isOptional,newBlockMarker:l===a||l.def!==o&&null!==l.fn,casing:null,def:r.staticDefinitionSymbol||o,placeholder:r.staticDefinitionSymbol!==a?o:a,nativeDef:o}),b=!1}}function l(t){t&&t.matches&&e.each(t.matches,function(e,i){var o=t.matches[e+1];(o===a||o.matches===a||!1===o.isQuantifier)&&i&&i.isGroup&&(i.isGroup=!1,n||(s(i,r.groupmarker.start,0),!0!==i.openGroup&&s(i,r.groupmarker.end))),l(i)})}function c(){if(P.length>0){if(m=P[P.length-1],s(m,f),m.isAlternator){h=P.pop();for(var e=0;e<h.matches.length;e++)h.matches[e].isGroup=!1;P.length>0?(m=P[P.length-1],m.matches.push(h)):x.matches.push(h)}}else s(x,f)}function u(e){e.matches=e.matches.reverse();for(var t in e.matches)if(e.matches.hasOwnProperty(t)){var n=parseInt(t);if(e.matches[t].isQuantifier&&e.matches[n+1]&&e.matches[n+1].isGroup){var i=e.matches[t];e.matches.splice(t,1),e.matches.splice(n+1,0,i)}e.matches[t]=e.matches[t].matches!==a?u(e.matches[t]):function(e){return e===r.optionalmarker.start?e=r.optionalmarker.end:e===r.optionalmarker.end?e=r.optionalmarker.start:e===r.groupmarker.start?e=r.groupmarker.end:e===r.groupmarker.end&&(e=r.groupmarker.start),e}(e.matches[t])}return e}var p,f,d,m,h,g,v,y=/(?:[?*+]|\{[0-9\+\*]+(?:,[0-9\+\*]*)?\})|[^.?*+^${[]()|\\]+|./g,k=/\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g,b=!1,x=new o,P=[],S=[];for(n&&(r.optionalmarker.start=a,r.optionalmarker.end=a);p=n?k.exec(t):y.exec(t);){if(f=p[0],n)switch(f.charAt(0)){case"?":f="{0,1}";break;case"+":case"*":f="{"+f+"}"}if(b)c();else switch(f.charAt(0)){case r.escapeChar:b=!0,n&&c();break;case r.optionalmarker.end:case r.groupmarker.end:if(d=P.pop(),d.openGroup=!1,d!==a)if(P.length>0){if(m=P[P.length-1],m.matches.push(d),m.isAlternator){h=P.pop();for(var w=0;w<h.matches.length;w++)h.matches[w].isGroup=!1,h.matches[w].alternatorGroup=!1;P.length>0?(m=P[P.length-1],m.matches.push(h)):x.matches.push(h)}}else x.matches.push(d);else c();break;case r.optionalmarker.start:P.push(new o(!1,!0));break;case r.groupmarker.start:P.push(new o(!0));break;case r.quantifiermarker.start:var A=new o(!1,!1,!0);f=f.replace(/[{}]/g,"");var E=f.split(","),C=isNaN(E[0])?E[0]:parseInt(E[0]),O=1===E.length?C:isNaN(E[1])?E[1]:parseInt(E[1]);if("*"!==O&&"+"!==O||(C="*"===O?0:1),A.quantifier={min:C,max:O},P.length>0){var R=P[P.length-1].matches;p=R.pop(),p.isGroup||(v=new o(!0),v.matches.push(p),p=v),R.push(p),R.push(A)}else p=x.matches.pop(),p.isGroup||(n&&null===p.fn&&"."===p.def&&(p.fn=new RegExp(p.def,r.casing?"i":"")),v=new o(!0),v.matches.push(p),p=v),x.matches.push(p),x.matches.push(A);break;case r.alternatormarker:if(P.length>0){m=P[P.length-1];var M=m.matches[m.matches.length-1];g=m.openGroup&&(M.matches===a||!1===M.isGroup&&!1===M.isAlternator)?P.pop():m.matches.pop()}else g=x.matches.pop();if(g.isAlternator)P.push(g);else if(g.alternatorGroup?(h=P.pop(),g.alternatorGroup=!1):h=new o(!1,!1,!1,!0),h.matches.push(g),P.push(h),g.openGroup){g.openGroup=!1;var _=new o(!0);_.alternatorGroup=!0,P.push(_)}break;default:c()}}for(;P.length>0;)d=P.pop(),x.matches.push(d);return x.matches.length>0&&(l(x),S.push(x)),(r.numericInput||r.isRTL)&&u(S[0]),S}},i.extendDefaults=function(t){e.extend(!0,i.prototype.defaults,t)},i.extendDefinitions=function(t){e.extend(!0,i.prototype.definitions,t)},i.extendAliases=function(t){e.extend(!0,i.prototype.aliases,t)},i.format=function(e,t,n){return i(t).format(e,n)},i.unmask=function(e,t){return i(t).unmaskedvalue(e)},i.isValid=function(e,t){return i(t).isValid(e)},i.remove=function(t){e.each(t,function(e,t){t.inputmask&&t.inputmask.remove()})},i.escapeRegex=function(e){var t=["/",".","*","+","?","|","(",")","[","]","{","}","\\","$","^"];return e.replace(new RegExp("(\\"+t.join("|\\")+")","gim"),"\\$1")},i.keyCode={ALT:18,BACKSPACE:8,BACKSPACE_SAFARI:127,CAPS_LOCK:20,COMMA:188,COMMAND:91,COMMAND_LEFT:91,COMMAND_RIGHT:93,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,MENU:93,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38,WINDOWS:91,X:88},i})},function(e){e.exports=jQuery},function(e,t,n){"use strict";var a,i,r;"function"==typeof Symbol&&Symbol.iterator,!function(o){i=[n(0),n(1)],a=o,void 0!==(r="function"==typeof a?a.apply(t,i):a)&&(e.exports=r)}(function(e,t){function n(e){return isNaN(e)||29===new Date(e,2,0).getDate()}return t.extendAliases({"dd/mm/yyyy":{mask:"1/2/y",placeholder:"dd/mm/yyyy",regex:{val1pre:new RegExp("[0-3]"),val1:new RegExp("0[1-9]|[12][0-9]|3[01]"),val2pre:function(e){var n=t.escapeRegex.call(this,e);return new RegExp("((0[1-9]|[12][0-9]|3[01])"+n+"[01])")},val2:function(e){var n=t.escapeRegex.call(this,e);return new RegExp("((0[1-9]|[12][0-9])"+n+"(0[1-9]|1[012]))|(30"+n+"(0[13-9]|1[012]))|(31"+n+"(0[13578]|1[02]))")}},leapday:"29/02/",separator:"/",yearrange:{minyear:1900,maxyear:2099},isInYearRange:function(e,t,n){if(isNaN(e))return!1;var a=parseInt(e.concat(t.toString().slice(e.length))),i=parseInt(e.concat(n.toString().slice(e.length)));return!isNaN(a)&&a>=t&&n>=a||!isNaN(i)&&i>=t&&n>=i},determinebaseyear:function(e,t,n){var a=(new Date).getFullYear();if(e>a)return e;if(a>t){for(var i=t.toString().slice(0,2),r=t.toString().slice(2,4);i+n>t;)i--;var o=i+r;return e>o?e:o}if(a>=e&&t>=a){for(var s=a.toString().slice(0,2);s+n>t;)s--;var l=s+n;return e>l?e:l}return a},onKeyDown:function(n){var a=e(this);if(n.ctrlKey&&n.keyCode===t.keyCode.RIGHT){var i=new Date;a.val(i.getDate().toString()+(i.getMonth()+1).toString()+i.getFullYear().toString()),a.trigger("setvalue")}},getFrontValue:function(e,t,n){for(var a=0,i=0,r=0;r<e.length&&"2"!==e.charAt(r);r++){var o=n.definitions[e.charAt(r)];o?(a+=i,i=o.cardinality):i++}return t.join("").substr(a,i)},postValidation:function(e,t,a){var i,r,o=e.join("");return 0===a.mask.indexOf("y")?(r=o.substr(0,4),i=o.substring(4,10)):(r=o.substring(6,10),i=o.substr(0,6)),t&&(i!==a.leapday||n(r))},definitions:{1:{validator:function(e,t,n,a,i){var r=i.regex.val1.test(e);return a||r||e.charAt(1)!==i.separator&&-1==="-./".indexOf(e.charAt(1))||!(r=i.regex.val1.test("0"+e.charAt(0)))?r:(t.buffer[n-1]="0",{refreshFromBuffer:{start:n-1,end:n},pos:n,c:e.charAt(0)})},cardinality:2,prevalidator:[{validator:function(e,t,n,a,i){var r=e;isNaN(t.buffer[n+1])||(r+=t.buffer[n+1]);var o=1===r.length?i.regex.val1pre.test(r):i.regex.val1.test(r);if(!a&&!o){if(o=i.regex.val1.test(e+"0"))return t.buffer[n]=e,t.buffer[++n]="0",{pos:n,c:"0"};if(o=i.regex.val1.test("0"+e))return t.buffer[n]="0",n++,{pos:n}}return o},cardinality:1}]},2:{validator:function(e,t,n,a,i){var r=i.getFrontValue(t.mask,t.buffer,i);-1!==r.indexOf(i.placeholder[0])&&(r="01"+i.separator);var o=i.regex.val2(i.separator).test(r+e);return a||o||e.charAt(1)!==i.separator&&-1==="-./".indexOf(e.charAt(1))||!(o=i.regex.val2(i.separator).test(r+"0"+e.charAt(0)))?o:(t.buffer[n-1]="0",{refreshFromBuffer:{start:n-1,end:n},pos:n,c:e.charAt(0)})},cardinality:2,prevalidator:[{validator:function(e,t,n,a,i){isNaN(t.buffer[n+1])||(e+=t.buffer[n+1]);var r=i.getFrontValue(t.mask,t.buffer,i);-1!==r.indexOf(i.placeholder[0])&&(r="01"+i.separator);var o=1===e.length?i.regex.val2pre(i.separator).test(r+e):i.regex.val2(i.separator).test(r+e);return a||o||!(o=i.regex.val2(i.separator).test(r+"0"+e))?o:(t.buffer[n]="0",n++,{pos:n})},cardinality:1}]},y:{validator:function(e,t,n,a,i){return i.isInYearRange(e,i.yearrange.minyear,i.yearrange.maxyear)},cardinality:4,prevalidator:[{validator:function(e,t,n,a,i){var r=i.isInYearRange(e,i.yearrange.minyear,i.yearrange.maxyear);if(!a&&!r){var o=i.determinebaseyear(i.yearrange.minyear,i.yearrange.maxyear,e+"0").toString().slice(0,1);if(r=i.isInYearRange(o+e,i.yearrange.minyear,i.yearrange.maxyear))return t.buffer[n++]=o.charAt(0),{pos:n};if(o=i.determinebaseyear(i.yearrange.minyear,i.yearrange.maxyear,e+"0").toString().slice(0,2),r=i.isInYearRange(o+e,i.yearrange.minyear,i.yearrange.maxyear))return t.buffer[n++]=o.charAt(0),t.buffer[n++]=o.charAt(1),{pos:n}}return r},cardinality:1},{validator:function(e,t,n,a,i){var r=i.isInYearRange(e,i.yearrange.minyear,i.yearrange.maxyear);if(!a&&!r){var o=i.determinebaseyear(i.yearrange.minyear,i.yearrange.maxyear,e).toString().slice(0,2);if(r=i.isInYearRange(e[0]+o[1]+e[1],i.yearrange.minyear,i.yearrange.maxyear))return t.buffer[n++]=o.charAt(1),{pos:n};if(o=i.determinebaseyear(i.yearrange.minyear,i.yearrange.maxyear,e).toString().slice(0,2),r=i.isInYearRange(o+e,i.yearrange.minyear,i.yearrange.maxyear))return t.buffer[n-1]=o.charAt(0),t.buffer[n++]=o.charAt(1),t.buffer[n++]=e.charAt(0),{refreshFromBuffer:{start:n-3,end:n},pos:n}}return r},cardinality:2},{validator:function(e,t,n,a,i){return i.isInYearRange(e,i.yearrange.minyear,i.yearrange.maxyear)},cardinality:3}]}},insertMode:!1,autoUnmask:!1},"mm/dd/yyyy":{placeholder:"mm/dd/yyyy",alias:"dd/mm/yyyy",regex:{val2pre:function(e){var n=t.escapeRegex.call(this,e);return new RegExp("((0[13-9]|1[012])"+n+"[0-3])|(02"+n+"[0-2])")},val2:function(e){var n=t.escapeRegex.call(this,e);return new RegExp("((0[1-9]|1[012])"+n+"(0[1-9]|[12][0-9]))|((0[13-9]|1[012])"+n+"30)|((0[13578]|1[02])"+n+"31)")},val1pre:new RegExp("[01]"),val1:new RegExp("0[1-9]|1[012]")},leapday:"02/29/",onKeyDown:function(n){var a=e(this);if(n.ctrlKey&&n.keyCode===t.keyCode.RIGHT){var i=new Date;a.val((i.getMonth()+1).toString()+i.getDate().toString()+i.getFullYear().toString()),a.trigger("setvalue")}}},"yyyy/mm/dd":{mask:"y/1/2",placeholder:"yyyy/mm/dd",alias:"mm/dd/yyyy",leapday:"/02/29",onKeyDown:function(n){var a=e(this);if(n.ctrlKey&&n.keyCode===t.keyCode.RIGHT){var i=new Date;a.val(i.getFullYear().toString()+(i.getMonth()+1).toString()+i.getDate().toString()),a.trigger("setvalue")}}},"dd.mm.yyyy":{mask:"1.2.y",placeholder:"dd.mm.yyyy",leapday:"29.02.",separator:".",alias:"dd/mm/yyyy"},"dd-mm-yyyy":{mask:"1-2-y",placeholder:"dd-mm-yyyy",leapday:"29-02-",separator:"-",alias:"dd/mm/yyyy"},"mm.dd.yyyy":{mask:"1.2.y",placeholder:"mm.dd.yyyy",leapday:"02.29.",separator:".",alias:"mm/dd/yyyy"},"mm-dd-yyyy":{mask:"1-2-y",placeholder:"mm-dd-yyyy",leapday:"02-29-",separator:"-",alias:"mm/dd/yyyy"},"yyyy.mm.dd":{mask:"y.1.2",placeholder:"yyyy.mm.dd",leapday:".02.29",separator:".",alias:"yyyy/mm/dd"},"yyyy-mm-dd":{mask:"y-1-2",placeholder:"yyyy-mm-dd",leapday:"-02-29",separator:"-",alias:"yyyy/mm/dd"},datetime:{mask:"1/2/y h:s",placeholder:"dd/mm/yyyy hh:mm",alias:"dd/mm/yyyy",regex:{hrspre:new RegExp("[012]"),hrs24:new RegExp("2[0-4]|1[3-9]"),hrs:new RegExp("[01][0-9]|2[0-4]"),ampm:new RegExp("^[a|p|A|P][m|M]"),mspre:new RegExp("[0-5]"),ms:new RegExp("[0-5][0-9]")},timeseparator:":",hourFormat:"24",definitions:{h:{validator:function(e,t,n,a,i){if("24"===i.hourFormat&&24===parseInt(e,10))return t.buffer[n-1]="0",t.buffer[n]="0",{refreshFromBuffer:{start:n-1,end:n},c:"0"};var r=i.regex.hrs.test(e);if(!a&&!r&&(e.charAt(1)===i.timeseparator||-1!=="-.:".indexOf(e.charAt(1)))&&(r=i.regex.hrs.test("0"+e.charAt(0))))return t.buffer[n-1]="0",t.buffer[n]=e.charAt(0),n++,{refreshFromBuffer:{start:n-2,end:n},pos:n,c:i.timeseparator};if(r&&"24"!==i.hourFormat&&i.regex.hrs24.test(e)){var o=parseInt(e,10);return 24===o?(t.buffer[n+5]="a",t.buffer[n+6]="m"):(t.buffer[n+5]="p",t.buffer[n+6]="m"),o-=12,10>o?(t.buffer[n]=o.toString(),t.buffer[n-1]="0"):(t.buffer[n]=o.toString().charAt(1),t.buffer[n-1]=o.toString().charAt(0)),{refreshFromBuffer:{start:n-1,end:n+6},c:t.buffer[n]}}return r},cardinality:2,prevalidator:[{validator:function(e,t,n,a,i){var r=i.regex.hrspre.test(e);return a||r||!(r=i.regex.hrs.test("0"+e))?r:(t.buffer[n]="0",n++,{pos:n})},cardinality:1}]},s:{validator:"[0-5][0-9]",cardinality:2,prevalidator:[{validator:function(e,t,n,a,i){var r=i.regex.mspre.test(e);return a||r||!(r=i.regex.ms.test("0"+e))?r:(t.buffer[n]="0",n++,{pos:n})},cardinality:1}]},t:{validator:function(e,t,n,a,i){return i.regex.ampm.test(e+"m")},casing:"lower",cardinality:1}},insertMode:!1,autoUnmask:!1},datetime12:{mask:"1/2/y h:s t\\m",placeholder:"dd/mm/yyyy hh:mm xm",alias:"datetime",hourFormat:"12"},"mm/dd/yyyy hh:mm xm":{mask:"1/2/y h:s t\\m",placeholder:"mm/dd/yyyy hh:mm xm",alias:"datetime12",regex:{val2pre:function(e){var n=t.escapeRegex.call(this,e);return new RegExp("((0[13-9]|1[012])"+n+"[0-3])|(02"+n+"[0-2])")},val2:function(e){var n=t.escapeRegex.call(this,e);return new RegExp("((0[1-9]|1[012])"+n+"(0[1-9]|[12][0-9]))|((0[13-9]|1[012])"+n+"30)|((0[13578]|1[02])"+n+"31)")},val1pre:new RegExp("[01]"),val1:new RegExp("0[1-9]|1[012]")},leapday:"02/29/",onKeyDown:function(n){var a=e(this);if(n.ctrlKey&&n.keyCode===t.keyCode.RIGHT){var i=new Date;a.val((i.getMonth()+1).toString()+i.getDate().toString()+i.getFullYear().toString()),a.trigger("setvalue")}}},"hh:mm t":{mask:"h:s t\\m",placeholder:"hh:mm xm",alias:"datetime",hourFormat:"12"},"h:s t":{mask:"h:s t\\m",placeholder:"hh:mm xm",alias:"datetime",hourFormat:"12"},"hh:mm:ss":{mask:"h:s:s",placeholder:"hh:mm:ss",alias:"datetime",autoUnmask:!1},"hh:mm":{mask:"h:s",placeholder:"hh:mm",alias:"datetime",autoUnmask:!1},date:{alias:"dd/mm/yyyy"},"mm/yyyy":{mask:"1/y",placeholder:"mm/yyyy",leapday:"donotuse",separator:"/",alias:"mm/dd/yyyy"},shamsi:{regex:{val2pre:function(e){var n=t.escapeRegex.call(this,e);return new RegExp("((0[1-9]|1[012])"+n+"[0-3])")},val2:function(e){var n=t.escapeRegex.call(this,e);return new RegExp("((0[1-9]|1[012])"+n+"(0[1-9]|[12][0-9]))|((0[1-9]|1[012])"+n+"30)|((0[1-6])"+n+"31)")},val1pre:new RegExp("[01]"),val1:new RegExp("0[1-9]|1[012]")},yearrange:{minyear:1300,maxyear:1499},mask:"y/1/2",leapday:"/12/30",placeholder:"yyyy/mm/dd",alias:"mm/dd/yyyy",clearIncomplete:!0},"yyyy-mm-dd hh:mm:ss":{mask:"y-1-2 h:s:s",placeholder:"yyyy-mm-dd hh:mm:ss",alias:"datetime",separator:"-",leapday:"-02-29",regex:{val2pre:function(e){var n=t.escapeRegex.call(this,e);return new RegExp("((0[13-9]|1[012])"+n+"[0-3])|(02"+n+"[0-2])")},val2:function(e){var n=t.escapeRegex.call(this,e);return new RegExp("((0[1-9]|1[012])"+n+"(0[1-9]|[12][0-9]))|((0[13-9]|1[012])"+n+"30)|((0[13578]|1[02])"+n+"31)")},val1pre:new RegExp("[01]"),val1:new RegExp("0[1-9]|1[012]")},onKeyDown:function(){}}}),t})},function(e,t,n){"use strict";var a,i,r;"function"==typeof Symbol&&Symbol.iterator,!function(o){i=[n(0),n(1)],a=o,void 0!==(r="function"==typeof a?a.apply(t,i):a)&&(e.exports=r)}(function(e,t){return t.extendDefinitions({A:{validator:"[A-Za-zА-яЁёÀ-ÿµ]",cardinality:1,casing:"upper"},"&":{validator:"[0-9A-Za-zА-яЁёÀ-ÿµ]",cardinality:1,casing:"upper"},"#":{validator:"[0-9A-Fa-f]",cardinality:1,casing:"upper"},U:{validator:"[А-Яа-яҐґЁёІіЄєЫыЇї'`‘\\-]",cardinality:1}}),t.extendAliases({url:{definitions:{i:{validator:".",cardinality:1}},mask:"(\\http://)|(\\http\\s://)|(ftp://)|(ftp\\s://)i{+}",insertMode:!1,autoUnmask:!1,inputmode:"url"},ip:{mask:"i[i[i]].i[i[i]].i[i[i]].i[i[i]]",definitions:{i:{validator:function(e,t,n){return n-1>-1&&"."!==t.buffer[n-1]?(e=t.buffer[n-1]+e,e=n-2>-1&&"."!==t.buffer[n-2]?t.buffer[n-2]+e:"0"+e):e="00"+e,new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(e)},cardinality:1}},onUnMask:function(e){return e},inputmode:"numeric"},email:{mask:"*{1,64}[.*{1,64}][.*{1,64}][.*{1,63}]@-{1,63}.-{1,63}[.-{1,63}][.-{1,63}]",greedy:!1,onBeforePaste:function(e){return e=e.toLowerCase(),e.replace("mailto:","")},definitions:{"*":{validator:"[0-9A-Za-z!#$%&'*+/=?^_`{|}~-]",cardinality:1,casing:"lower"},"-":{validator:"[0-9A-Za-z-]",cardinality:1,casing:"lower"}},onUnMask:function(e){return e},inputmode:"email"},mac:{mask:"##:##:##:##:##:##"},vin:{mask:"V{13}9{4}",definitions:{V:{validator:"[A-HJ-NPR-Za-hj-npr-z\\d]",cardinality:1,casing:"upper"}},clearIncomplete:!0,autoUnmask:!0}}),t})},function(e,t,n){"use strict";var a,i,r;"function"==typeof Symbol&&Symbol.iterator,!function(o){i=[n(0),n(1)],a=o,void 0!==(r="function"==typeof a?a.apply(t,i):a)&&(e.exports=r)}(function(e,t,n){function a(e,n){for(var a="",i=0;i<e.length;i++)a+=t.prototype.definitions[e.charAt(i)]||n.definitions[e.charAt(i)]||n.optionalmarker.start===e.charAt(i)||n.optionalmarker.end===e.charAt(i)||n.quantifiermarker.start===e.charAt(i)||n.quantifiermarker.end===e.charAt(i)||n.groupmarker.start===e.charAt(i)||n.groupmarker.end===e.charAt(i)||n.alternatormarker===e.charAt(i)?"\\"+e.charAt(i):e.charAt(i);

return a}return t.extendAliases({numeric:{mask:function(e){if(0!==e.repeat&&isNaN(e.integerDigits)&&(e.integerDigits=e.repeat),e.repeat=0,e.groupSeparator===e.radixPoint&&(e.groupSeparator="."===e.radixPoint?",":","===e.radixPoint?".":"")," "===e.groupSeparator&&(e.skipOptionalPartCharacter=n),e.autoGroup=e.autoGroup&&""!==e.groupSeparator,e.autoGroup&&("string"==typeof e.groupSize&&isFinite(e.groupSize)&&(e.groupSize=parseInt(e.groupSize)),isFinite(e.integerDigits))){var t=Math.floor(e.integerDigits/e.groupSize),i=e.integerDigits%e.groupSize;e.integerDigits=parseInt(e.integerDigits)+(0===i?t-1:t),e.integerDigits<1&&(e.integerDigits="*")}e.placeholder.length>1&&(e.placeholder=e.placeholder.charAt(0)),"radixFocus"===e.positionCaretOnClick&&""===e.placeholder&&!1===e.integerOptional&&(e.positionCaretOnClick="lvp"),e.definitions[";"]=e.definitions["~"],e.definitions[";"].definitionSymbol="~",!0===e.numericInput&&(e.positionCaretOnClick="radixFocus"===e.positionCaretOnClick?"lvp":e.positionCaretOnClick,e.digitsOptional=!1,isNaN(e.digits)&&(e.digits=2),e.decimalProtect=!1);var r="[+]";if(r+=a(e.prefix,e),r+=!0===e.integerOptional?"~{1,"+e.integerDigits+"}":"~{"+e.integerDigits+"}",e.digits!==n){e.radixPointDefinitionSymbol=e.decimalProtect?":":e.radixPoint;var o=e.digits.toString().split(",");isFinite(o[0]&&o[1]&&isFinite(o[1]))?r+=e.radixPointDefinitionSymbol+";{"+e.digits+"}":(isNaN(e.digits)||parseInt(e.digits)>0)&&(r+=e.digitsOptional?"["+e.radixPointDefinitionSymbol+";{1,"+e.digits+"}]":e.radixPointDefinitionSymbol+";{"+e.digits+"}")}return r+=a(e.suffix,e),r+="[-]",e.greedy=!1,r},placeholder:"",greedy:!1,digits:"*",digitsOptional:!0,enforceDigitsOnBlur:!1,radixPoint:".",positionCaretOnClick:"radixFocus",groupSize:3,groupSeparator:"",autoGroup:!1,allowMinus:!0,negationSymbol:{front:"-",back:""},integerDigits:"+",integerOptional:!0,prefix:"",suffix:"",rightAlign:!0,decimalProtect:!0,min:null,max:null,step:1,insertMode:!0,autoUnmask:!1,unmaskAsNumber:!1,inputmode:"numeric",preValidation:function(t,a,i,r,o){if("-"===i||i===o.negationSymbol.front)return!0===o.allowMinus&&(o.isNegative=o.isNegative===n||!o.isNegative,""===t.join("")||{caret:a,dopost:!0});if(!1===r&&i===o.radixPoint&&o.digits!==n&&(isNaN(o.digits)||parseInt(o.digits)>0)){var s=e.inArray(o.radixPoint,t);if(-1!==s)return!0===o.numericInput?a===s:{caret:s+1}}return!0},postValidation:function(a,i,r){var o=r.suffix.split(""),s=r.prefix.split("");if(i.pos===n&&i.caret!==n&&!0!==i.dopost)return i;var l=i.caret!==n?i.caret:i.pos,c=a.slice();r.numericInput&&(l=c.length-l-1,c=c.reverse());var u=c[l];if(u===r.groupSeparator&&(l+=1,u=c[l]),l===c.length-r.suffix.length-1&&u===r.radixPoint)return i;u!==n&&u!==r.radixPoint&&u!==r.negationSymbol.front&&u!==r.negationSymbol.back&&(c[l]="?",r.prefix.length>0&&l>=(!1===r.isNegative?1:0)&&l<r.prefix.length-1+(!1===r.isNegative?1:0)?s[l-(!1===r.isNegative?1:0)]="?":r.suffix.length>0&&l>=c.length-r.suffix.length-(!1===r.isNegative?1:0)&&(o[l-(c.length-r.suffix.length-(!1===r.isNegative?1:0))]="?")),s=s.join(""),o=o.join("");var p=c.join("").replace(s,"");if(p=p.replace(o,""),p=p.replace(new RegExp(t.escapeRegex(r.groupSeparator),"g"),""),p=p.replace(new RegExp("[-"+t.escapeRegex(r.negationSymbol.front)+"]","g"),""),p=p.replace(new RegExp(t.escapeRegex(r.negationSymbol.back)+"$"),""),isNaN(r.placeholder)&&(p=p.replace(new RegExp(t.escapeRegex(r.placeholder),"g"),"")),p.length>1&&1!==p.indexOf(r.radixPoint)&&("0"===u&&(p=p.replace(/^\?/g,"")),p=p.replace(/^0/g,"")),p.charAt(0)===r.radixPoint&&""!==r.radixPoint&&!0!==r.numericInput&&(p="0"+p),""!==p){if(p=p.split(""),(!r.digitsOptional||r.enforceDigitsOnBlur&&"blur"===i.event)&&isFinite(r.digits)){var f=e.inArray(r.radixPoint,p),d=e.inArray(r.radixPoint,c);-1===f&&(p.push(r.radixPoint),f=p.length-1);for(var m=1;m<=r.digits;m++)r.digitsOptional&&(!r.enforceDigitsOnBlur||"blur"!==i.event)||p[f+m]!==n&&p[f+m]!==r.placeholder.charAt(0)?-1!==d&&c[d+m]!==n&&(p[f+m]=p[f+m]||c[d+m]):p[f+m]=i.placeholder||r.placeholder.charAt(0)}if(!0!==r.autoGroup||""===r.groupSeparator||u===r.radixPoint&&i.pos===n&&!i.dopost)p=p.join("");else{var h=p[p.length-1]===r.radixPoint&&i.c===r.radixPoint;p=t(function(e,t){var n="";if(n+="("+t.groupSeparator+"*{"+t.groupSize+"}){*}",""!==t.radixPoint){var a=e.join("").split(t.radixPoint);a[1]&&(n+=t.radixPoint+"*{"+a[1].match(/^\d*\??\d*/)[0].length+"}")}return n}(p,r),{numericInput:!0,jitMasking:!0,definitions:{"*":{validator:"[0-9?]",cardinality:1}}}).format(p.join("")),h&&(p+=r.radixPoint),p.charAt(0)===r.groupSeparator&&p.substr(1)}}if(r.isNegative&&"blur"===i.event&&(r.isNegative="0"!==p),p=s+p,p+=o,r.isNegative&&(p=r.negationSymbol.front+p,p+=r.negationSymbol.back),p=p.split(""),u!==n)if(u!==r.radixPoint&&u!==r.negationSymbol.front&&u!==r.negationSymbol.back)l=e.inArray("?",p),l>-1?p[l]=u:l=i.caret||0;else if(u===r.radixPoint||u===r.negationSymbol.front||u===r.negationSymbol.back){var g=e.inArray(u,p);-1!==g&&(l=g)}r.numericInput&&(l=p.length-l-1,p=p.reverse());var v={caret:u===n||i.pos!==n?l+(r.numericInput?-1:1):l,buffer:p,refreshFromBuffer:i.dopost||a.join("")!==p.join("")};return v.refreshFromBuffer?v:i},onBeforeWrite:function(a,i,r,o){if(a)switch(a.type){case"keydown":return o.postValidation(i,{caret:r,dopost:!0},o);case"blur":case"checkval":var s;if(function(e){e.parseMinMaxOptions===n&&(null!==e.min&&(e.min=e.min.toString().replace(new RegExp(t.escapeRegex(e.groupSeparator),"g"),""),","===e.radixPoint&&(e.min=e.min.replace(e.radixPoint,".")),e.min=isFinite(e.min)?parseFloat(e.min):0/0,isNaN(e.min)&&(e.min=Number.MIN_VALUE)),null!==e.max&&(e.max=e.max.toString().replace(new RegExp(t.escapeRegex(e.groupSeparator),"g"),""),","===e.radixPoint&&(e.max=e.max.replace(e.radixPoint,".")),e.max=isFinite(e.max)?parseFloat(e.max):0/0,isNaN(e.max)&&(e.max=Number.MAX_VALUE)),e.parseMinMaxOptions="done")}(o),null!==o.min||null!==o.max){if(s=o.onUnMask(i.join(""),n,e.extend({},o,{unmaskAsNumber:!0})),null!==o.min&&s<o.min)return o.isNegative=o.min<0,o.postValidation(o.min.toString().replace(".",o.radixPoint).split(""),{caret:r,dopost:!0,placeholder:"0"},o);if(null!==o.max&&s>o.max)return o.isNegative=o.max<0,o.postValidation(o.max.toString().replace(".",o.radixPoint).split(""),{caret:r,dopost:!0,placeholder:"0"},o)}return o.postValidation(i,{caret:r,placeholder:"0",event:"blur"},o);case"_checkval":return{caret:r}}},regex:{integerPart:function(e,n){return new RegExp(n?"["+t.escapeRegex(e.negationSymbol.front)+"+]?":"["+t.escapeRegex(e.negationSymbol.front)+"+]?\\d+")},integerNPart:function(e){return new RegExp("[\\d"+t.escapeRegex(e.groupSeparator)+t.escapeRegex(e.placeholder.charAt(0))+"]+")}},definitions:{"~":{validator:function(e,a,i,r,o,s){var l=r?new RegExp("[0-9"+t.escapeRegex(o.groupSeparator)+"]").test(e):new RegExp("[0-9]").test(e);if(!0===l){if(!0!==o.numericInput&&a.validPositions[i]!==n&&"~"===a.validPositions[i].match.def&&!s){var c=a.buffer.join("");c=c.replace(new RegExp("[-"+t.escapeRegex(o.negationSymbol.front)+"]","g"),""),c=c.replace(new RegExp(t.escapeRegex(o.negationSymbol.back)+"$"),"");var u=c.split(o.radixPoint);u.length>1&&(u[1]=u[1].replace(/0/g,o.placeholder.charAt(0))),"0"===u[0]&&(u[0]=u[0].replace(/0/g,o.placeholder.charAt(0))),c=u[0]+o.radixPoint+u[1]||"";var p=a._buffer.join("");for(c===o.radixPoint&&(c=p);null===c.match(t.escapeRegex(p)+"$");)p=p.slice(1);c=c.replace(p,""),c=c.split(""),l=c[i]===n?{pos:i,remove:i}:{pos:i}}}else r||e!==o.radixPoint||a.validPositions[i-1]!==n||(a.buffer[i]="0",l={pos:i+1});return l},cardinality:1},"+":{validator:function(e,t,n,a,i){return i.allowMinus&&("-"===e||e===i.negationSymbol.front)},cardinality:1,placeholder:""},"-":{validator:function(e,t,n,a,i){return i.allowMinus&&e===i.negationSymbol.back},cardinality:1,placeholder:""},":":{validator:function(e,n,a,i,r){var o="["+t.escapeRegex(r.radixPoint)+"]",s=new RegExp(o).test(e);return s&&n.validPositions[a]&&n.validPositions[a].match.placeholder===r.radixPoint&&(s={caret:a+1}),s},cardinality:1,placeholder:function(e){return e.radixPoint}}},onUnMask:function(e,n,a){if(""===n&&!0===a.nullable)return n;var i=e.replace(a.prefix,"");return i=i.replace(a.suffix,""),i=i.replace(new RegExp(t.escapeRegex(a.groupSeparator),"g"),""),""!==a.placeholder.charAt(0)&&(i=i.replace(new RegExp(a.placeholder.charAt(0),"g"),"0")),a.unmaskAsNumber?(""!==a.radixPoint&&-1!==i.indexOf(a.radixPoint)&&(i=i.replace(t.escapeRegex.call(this,a.radixPoint),".")),i=i.replace(new RegExp("^"+t.escapeRegex(a.negationSymbol.front)),"-"),i=i.replace(new RegExp(t.escapeRegex(a.negationSymbol.back)+"$"),""),Number(i)):i},isComplete:function(e,n){var a=e.join("");if(e.slice().join("")!==a)return!1;var i=a.replace(n.prefix,"");return i=i.replace(n.suffix,""),i=i.replace(new RegExp(t.escapeRegex(n.groupSeparator),"g"),""),","===n.radixPoint&&(i=i.replace(t.escapeRegex(n.radixPoint),".")),isFinite(i)},onBeforeMask:function(e,a){if(a.isNegative=n,e=e.toString().charAt(e.length-1)===a.radixPoint?e.toString().substr(0,e.length-1):e.toString(),""!==a.radixPoint&&isFinite(e)){var i=e.split("."),r=""!==a.groupSeparator?parseInt(a.groupSize):0;2===i.length&&(i[0].length>r||i[1].length>r||i[0].length<=r&&i[1].length<r)&&(e=e.replace(".",a.radixPoint))}var o=e.match(/,/g),s=e.match(/\./g);if(s&&o?s.length>o.length?(e=e.replace(/\./g,""),e=e.replace(",",a.radixPoint)):o.length>s.length?(e=e.replace(/,/g,""),e=e.replace(".",a.radixPoint)):e=e.indexOf(".")<e.indexOf(",")?e.replace(/\./g,""):e.replace(/,/g,""):e=e.replace(new RegExp(t.escapeRegex(a.groupSeparator),"g"),""),0===a.digits&&(-1!==e.indexOf(".")?e=e.substring(0,e.indexOf(".")):-1!==e.indexOf(",")&&(e=e.substring(0,e.indexOf(",")))),""!==a.radixPoint&&isFinite(a.digits)&&-1!==e.indexOf(a.radixPoint)){var l=e.split(a.radixPoint),c=l[1].match(new RegExp("\\d*"))[0];if(parseInt(a.digits)<c.toString().length){var u=Math.pow(10,parseInt(a.digits));e=e.replace(t.escapeRegex(a.radixPoint),"."),e=Math.round(parseFloat(e)*u)/u,e=e.toString().replace(".",a.radixPoint)}}return e},canClearPosition:function(e,t,n,a,i){var r=e.validPositions[t],o=r.input!==i.radixPoint||null!==e.validPositions[t].match.fn&&!1===i.decimalProtect||r.input===i.radixPoint&&e.validPositions[t+1]&&null===e.validPositions[t+1].match.fn||isFinite(r.input)||t===n||r.input===i.groupSeparator||r.input===i.negationSymbol.front||r.input===i.negationSymbol.back;return!o||"+"!==r.match.nativeDef&&"-"!==r.match.nativeDef||(i.isNegative=!1),o},onKeyDown:function(n,a,i,r){var o=e(this);if(n.ctrlKey)switch(n.keyCode){case t.keyCode.UP:o.val(parseFloat(this.inputmask.unmaskedvalue())+parseInt(r.step)),o.trigger("setvalue");break;case t.keyCode.DOWN:o.val(parseFloat(this.inputmask.unmaskedvalue())-parseInt(r.step)),o.trigger("setvalue")}}},currency:{prefix:"$ ",groupSeparator:",",alias:"numeric",placeholder:"0",autoGroup:!0,digits:2,digitsOptional:!1,clearMaskOnLostFocus:!1},decimal:{alias:"numeric"},integer:{alias:"numeric",digits:0,radixPoint:""},percentage:{alias:"numeric",digits:2,digitsOptional:!0,radixPoint:".",placeholder:"0",autoGroup:!1,min:0,max:100,suffix:" %",allowMinus:!1}}),t})},function(e,t,n){"use strict";var a,i,r;"function"==typeof Symbol&&Symbol.iterator,!function(o){i=[n(0),n(1)],a=o,void 0!==(r="function"==typeof a?a.apply(t,i):a)&&(e.exports=r)}(function(e,t){function n(e,t){var n=(e.mask||e).replace(/#/g,"9").replace(/\)/,"9").replace(/[+()#-]/g,""),a=(t.mask||t).replace(/#/g,"9").replace(/\)/,"9").replace(/[+()#-]/g,""),i=(e.mask||e).split("#")[0],r=(t.mask||t).split("#")[0];return 0===r.indexOf(i)?-1:0===i.indexOf(r)?1:n.localeCompare(a)}var a=t.prototype.analyseMask;return t.prototype.analyseMask=function(t,n,i){function r(e,n,a){n=n||"",a=a||s,""!==n&&(a[n]={});for(var i="",o=a[n]||a,l=e.length-1;l>=0;l--)t=e[l].mask||e[l],i=t.substr(0,1),o[i]=o[i]||[],o[i].unshift(t.substr(1)),e.splice(l,1);for(var c in o)o[c].length>500&&r(o[c].slice(),c,o)}function o(t){var n="",a=[];for(var r in t)a.push(e.isArray(t[r])?1===t[r].length?r+t[r]:r+i.groupmarker.start+t[r].join(i.groupmarker.end+i.alternatormarker+i.groupmarker.start)+i.groupmarker.end:r+o(t[r]));return n+=1===a.length?a[0]:i.groupmarker.start+a.join(i.groupmarker.end+i.alternatormarker+i.groupmarker.start)+i.groupmarker.end}var s={};return i.phoneCodes&&(i.phoneCodes&&i.phoneCodes.length>1e3&&(t=t.substr(1,t.length-2),r(t.split(i.groupmarker.end+i.alternatormarker+i.groupmarker.start)),t=o(s)),t=t.replace(/9/g,"\\9")),a.call(this,t,n,i)},t.extendAliases({abstractphone:{groupmarker:{start:"<",end:">"},countrycode:"",phoneCodes:[],mask:function(e){return e.definitions={"#":t.prototype.definitions[9]},e.phoneCodes.sort(n)},keepStatic:!0,onBeforeMask:function(e,t){var n=e.replace(/^0{1,2}/,"").replace(/[\s]/g,"");return(n.indexOf(t.countrycode)>1||-1===n.indexOf(t.countrycode))&&(n="+"+t.countrycode+n),n},onUnMask:function(e){return e.replace(/[()#-]/g,"")},inputmode:"tel"}}),t})},function(e,t,n){"use strict";var a,i,r,o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};!function(o){i=[n(2),n(1)],a=o,void 0!==(r="function"==typeof a?a.apply(t,i):a)&&(e.exports=r)}(function(e,t){return void 0===e.fn.inputmask&&(e.fn.inputmask=function(n,a){var i,r=this[0];if(void 0===a&&(a={}),"string"==typeof n)switch(n){case"unmaskedvalue":return r&&r.inputmask?r.inputmask.unmaskedvalue():e(r).val();case"remove":return this.each(function(){this.inputmask&&this.inputmask.remove()});case"getemptymask":return r&&r.inputmask?r.inputmask.getemptymask():"";case"hasMaskedValue":return!(!r||!r.inputmask)&&r.inputmask.hasMaskedValue();case"isComplete":return!r||!r.inputmask||r.inputmask.isComplete();case"getmetadata":return r&&r.inputmask?r.inputmask.getmetadata():void 0;case"setvalue":e(r).val(a),r&&void 0===r.inputmask&&e(r).triggerHandler("setvalue");break;case"option":if("string"!=typeof a)return this.each(function(){return void 0!==this.inputmask?this.inputmask.option(a):void 0});if(r&&void 0!==r.inputmask)return r.inputmask.option(a);break;default:return a.alias=n,i=new t(a),this.each(function(){i.mask(this)})}else{if("object"==(void 0===n?"undefined":o(n)))return i=new t(n),this.each(void 0===n.mask&&void 0===n.alias?function(){return void 0!==this.inputmask?this.inputmask.option(n):void i.mask(this)}:function(){i.mask(this)});if(void 0===n)return this.each(function(){i=new t(a),i.mask(this)})}}),e.fn.inputmask})},function(e,t,n){var a=n(12);"string"==typeof a&&(a=[[e.i,a,""]]),n(14)(a,{}),a.locals&&(e.exports=a.locals)},function(e,t,n){"use strict";function a(e){return e&&e.__esModule?e:{"default":e}}n(8),n(3),n(4),n(5),n(6);var i=n(1),r=a(i),o=n(0),s=a(o),l=n(2),c=a(l);s["default"]===c["default"]&&n(7),window.Inputmask=r["default"]},function(e,t,n){"use strict";var a;"function"==typeof Symbol&&Symbol.iterator,void 0!==(a=function(){return document}.call(t,n,t,e))&&(e.exports=a)},function(e,t,n){"use strict";var a;"function"==typeof Symbol&&Symbol.iterator,void 0!==(a=function(){return window}.call(t,n,t,e))&&(e.exports=a)},function(e,t,n){t=e.exports=n(13)(void 0),t.push([e.i,"span.im-caret {\r\n    -webkit-animation: 1s blink step-end infinite;\r\n    animation: 1s blink step-end infinite;\r\n}\r\n\r\n@keyframes blink {\r\n    from, to {\r\n        border-right-color: black;\r\n    }\r\n    50% {\r\n        border-right-color: transparent;\r\n    }\r\n}\r\n\r\n@-webkit-keyframes blink {\r\n    from, to {\r\n        border-right-color: black;\r\n    }\r\n    50% {\r\n        border-right-color: transparent;\r\n    }\r\n}\r\n\r\nspan.im-static {\r\n    color: grey;\r\n}\r\n\r\ndiv.im-colormask {\r\n    display: inline-block;\r\n    border-style: inset;\r\n    border-width: 2px;\r\n    -webkit-appearance: textfield;\r\n    -moz-appearance: textfield;\r\n    appearance: textfield;\r\n}\r\n\r\ndiv.im-colormask > input {\r\n    position: absolute;\r\n    display: inline-block;\r\n    background-color: transparent;\r\n    color: transparent;\r\n    -webkit-appearance: caret;\r\n    -moz-appearance: caret;\r\n    appearance: caret;\r\n    border-style: none;\r\n    left: 0; /*calculated*/\r\n}\r\n\r\ndiv.im-colormask > input:focus {\r\n    outline: none;\r\n}\r\n\r\ndiv.im-colormask > div {\r\n    color: black;\r\n    display: inline-block;\r\n    width: 100px; /*calculated*/\r\n}",""])},function(e){function t(e,t){var a=e[1]||"",i=e[3];if(!i)return a;if(t&&"function"==typeof btoa){var r=n(i),o=i.sources.map(function(e){return"/*# sourceURL="+i.sourceRoot+e+" */"});return[a].concat(o).concat([r]).join("\n")}return[a].join("\n")}function n(e){return"/*# sourceMappingURL=data:application/json;charset=utf-8;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(e))))+" */"}e.exports=function(e){var n=[];return n.toString=function(){return this.map(function(n){var a=t(n,e);return n[2]?"@media "+n[2]+"{"+a+"}":a}).join("")},n.i=function(e,t){"string"==typeof e&&(e=[[null,e,""]]);for(var a={},i=0;i<this.length;i++){var r=this[i][0];"number"==typeof r&&(a[r]=!0)}for(i=0;i<e.length;i++){var o=e[i];"number"==typeof o[0]&&a[o[0]]||(t&&!o[2]?o[2]=t:t&&(o[2]="("+o[2]+") and ("+t+")"),n.push(o))}},n}},function(e,t,n){function a(e,t){for(var n=0;n<e.length;n++){var a=e[n],i=m[a.id];if(i){i.refs++;for(var r=0;r<i.parts.length;r++)i.parts[r](a.parts[r]);for(;r<a.parts.length;r++)i.parts.push(u(a.parts[r],t))}else{for(var o=[],r=0;r<a.parts.length;r++)o.push(u(a.parts[r],t));m[a.id]={id:a.id,refs:1,parts:o}}}}function i(e){for(var t=[],n={},a=0;a<e.length;a++){var i=e[a],r=i[0],o=i[1],s=i[2],l=i[3],c={css:o,media:s,sourceMap:l};n[r]?n[r].parts.push(c):t.push(n[r]={id:r,parts:[c]})}return t}function r(e,t){var n=g(e.insertInto);if(!n)throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");var a=k[k.length-1];if("top"===e.insertAt)a?a.nextSibling?n.insertBefore(t,a.nextSibling):n.appendChild(t):n.insertBefore(t,n.firstChild),k.push(t);else{if("bottom"!==e.insertAt)throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");n.appendChild(t)}}function o(e){e.parentNode.removeChild(e);var t=k.indexOf(e);t>=0&&k.splice(t,1)}function s(e){var t=document.createElement("style");return e.attrs.type="text/css",c(t,e.attrs),r(e,t),t}function l(e){var t=document.createElement("link");return e.attrs.type="text/css",e.attrs.rel="stylesheet",c(t,e.attrs),r(e,t),t}function c(e,t){Object.keys(t).forEach(function(n){e.setAttribute(n,t[n])})}function u(e,t){var n,a,i;if(t.singleton){var r=y++;n=v||(v=s(t)),a=p.bind(null,n,r,!1),i=p.bind(null,n,r,!0)}else e.sourceMap&&"function"==typeof URL&&"function"==typeof URL.createObjectURL&&"function"==typeof URL.revokeObjectURL&&"function"==typeof Blob&&"function"==typeof btoa?(n=l(t),a=d.bind(null,n,t),i=function(){o(n),n.href&&URL.revokeObjectURL(n.href)}):(n=s(t),a=f.bind(null,n),i=function(){o(n)});return a(e),function(t){if(t){if(t.css===e.css&&t.media===e.media&&t.sourceMap===e.sourceMap)return;a(e=t)}else i()}}function p(e,t,n,a){var i=n?"":a.css;if(e.styleSheet)e.styleSheet.cssText=x(t,i);else{var r=document.createTextNode(i),o=e.childNodes;o[t]&&e.removeChild(o[t]),o.length?e.insertBefore(r,o[t]):e.appendChild(r)}}function f(e,t){var n=t.css,a=t.media;if(a&&e.setAttribute("media",a),e.styleSheet)e.styleSheet.cssText=n;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(n))}}function d(e,t,n){var a=n.css,i=n.sourceMap,r=void 0===t.convertToAbsoluteUrls&&i;(t.convertToAbsoluteUrls||r)&&(a=b(a)),i&&(a+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(i))))+" */");var o=new Blob([a],{type:"text/css"}),s=e.href;e.href=URL.createObjectURL(o),s&&URL.revokeObjectURL(s)}var m={},h=function(e){var t;return function(){return void 0===t&&(t=e.apply(this,arguments)),t}}(function(){return window&&document&&document.all&&!window.atob}),g=function(e){var t={};return function(n){return void 0===t[n]&&(t[n]=e.call(this,n)),t[n]}}(function(e){return document.querySelector(e)}),v=null,y=0,k=[],b=n(15);e.exports=function(e,t){if("undefined"!=typeof DEBUG&&DEBUG&&"object"!=typeof document)throw new Error("The style-loader cannot be used in a non-browser environment");t=t||{},t.attrs="object"==typeof t.attrs?t.attrs:{},void 0===t.singleton&&(t.singleton=h()),void 0===t.insertInto&&(t.insertInto="head"),void 0===t.insertAt&&(t.insertAt="bottom");var n=i(e);return a(n,t),function(e){for(var r=[],o=0;o<n.length;o++){var s=n[o],l=m[s.id];l.refs--,r.push(l)}e&&a(i(e),t);for(var o=0;o<r.length;o++){var l=r[o];if(0===l.refs){for(var c=0;c<l.parts.length;c++)l.parts[c]();delete m[l.id]}}}};var x=function(){var e=[];return function(t,n){return e[t]=n,e.filter(Boolean).join("\n")}}()},function(e){e.exports=function(e){var t="undefined"!=typeof window&&window.location;if(!t)throw new Error("fixUrls requires window.location");if(!e||"string"!=typeof e)return e;var n=t.protocol+"//"+t.host,a=n+t.pathname.replace(/\/[^\/]*$/,"/");return e.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,function(e,t){var i=t.trim().replace(/^"(.*)"$/,function(e,t){return t}).replace(/^'(.*)'$/,function(e,t){return t});if(/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(i))return e;var r;return r=0===i.indexOf("//")?i:0===i.indexOf("/")?n+i:a+i.replace(/^\.\//,""),"url("+JSON.stringify(r)+")"})}}]);
//# sourceMappingURL=jquery.inputmask.bundle.min.js.map
/*
    jQuery Masked Input Plugin
    Copyright (c) 2007 - 2015 Josh Bush (digitalbush.com)
    Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license)
    Version: 1.4.1
*/
!function(factory) {
    "function" == typeof define && define.amd ? define([ "jquery" ], factory) : factory("object" == typeof exports ? require("jquery") : jQuery);
}(function($) {
    var caretTimeoutId, ua = navigator.userAgent, iPhone = /iphone/i.test(ua), chrome = /chrome/i.test(ua), android = /android/i.test(ua);
    $.mask = {
        definitions: {
            "9": "[0-9]",
            a: "[A-Za-z]",
            U: "[А-Яа-яҐґЁёІіЄєЫыЇї'`‘\\-]{1,64}",
            "*": "[A-Za-z0-9]"
        },
        autoclear: !0,
        dataName: "rawMaskFn",
        placeholder: "_"
    }, $.fn.extend({
        caret: function(begin, end) {
            var range;
            if (0 !== this.length && !this.is(":hidden")) return "number" == typeof begin ? (end = "number" == typeof end ? end : begin,
            this.each(function() {
                this.setSelectionRange ? this.setSelectionRange(begin, end) : this.createTextRange && (range = this.createTextRange(),
                range.collapse(!0), range.moveEnd("character", end), range.moveStart("character", begin),
                range.select());
            })) : (this[0].setSelectionRange ? (begin = this[0].selectionStart, end = this[0].selectionEnd) : document.selection && document.selection.createRange && (range = document.selection.createRange(),
            begin = 0 - range.duplicate().moveStart("character", -1e5), end = begin + range.text.length),
            {
                begin: begin,
                end: end
            });
        },
        unmask: function() {
            return this.trigger("unmask");
        },
        mask: function(mask, settings) {
            var input, defs, tests, partialPosition, firstNonMaskPos, lastRequiredNonMaskPos, len, oldVal;
            if (!mask && this.length > 0) {
                input = $(this[0]);
                var fn = input.data($.mask.dataName);
                return fn ? fn() : void 0;
            }
            return settings = $.extend({
                autoclear: $.mask.autoclear,
                placeholder: $.mask.placeholder,
                completed: null
            }, settings), defs = $.mask.definitions, tests = [], partialPosition = len = mask.length,
            firstNonMaskPos = null, $.each(mask.split(""), function(i, c) {
                "?" == c ? (len--, partialPosition = i) : defs[c] ? (tests.push(new RegExp(defs[c])),
                null === firstNonMaskPos && (firstNonMaskPos = tests.length - 1), partialPosition > i && (lastRequiredNonMaskPos = tests.length - 1)) : tests.push(null);
            }), this.trigger("unmask").each(function() {
                function tryFireCompleted() {
                    if (settings.completed) {
                        for (var i = firstNonMaskPos; lastRequiredNonMaskPos >= i; i++) if (tests[i] && buffer[i] === getPlaceholder(i)) return;
                        settings.completed.call(input);
                    }
                }
                function getPlaceholder(i) {
                    return settings.placeholder.charAt(i < settings.placeholder.length ? i : 0);
                }
                function seekNext(pos) {
                    for (;++pos < len && !tests[pos]; ) ;
                    return pos;
                }
                function seekPrev(pos) {
                    for (;--pos >= 0 && !tests[pos]; ) ;
                    return pos;
                }
                function shiftL(begin, end) {
                    var i, j;
                    if (!(0 > begin)) {
                        for (i = begin, j = seekNext(end); len > i; i++) if (tests[i]) {
                            if (!(len > j && tests[i].test(buffer[j]))) break;
                            buffer[i] = buffer[j], buffer[j] = getPlaceholder(j), j = seekNext(j);
                        }
                        writeBuffer(), input.caret(Math.max(firstNonMaskPos, begin));
                    }
                }
                function shiftR(pos) {
                    var i, c, j, t;
                    for (i = pos, c = getPlaceholder(pos); len > i; i++) if (tests[i]) {
                        if (j = seekNext(i), t = buffer[i], buffer[i] = c, !(len > j && tests[j].test(t))) break;
                        c = t;
                    }
                }
                function androidInputEvent() {
                    var curVal = input.val(), pos = input.caret();
                    if (oldVal && oldVal.length && oldVal.length > curVal.length) {
                        for (checkVal(!0); pos.begin > 0 && !tests[pos.begin - 1]; ) pos.begin--;
                        if (0 === pos.begin) for (;pos.begin < firstNonMaskPos && !tests[pos.begin]; ) pos.begin++;
                        input.caret(pos.begin, pos.begin);
                    } else {
                        for (checkVal(!0); pos.begin < len && !tests[pos.begin]; ) pos.begin++;
                        input.caret(pos.begin, pos.begin);
                    }
                    tryFireCompleted();
                }
                function blurEvent() {
                    checkVal(), input.val() != focusText && input.change();
                }
                function keydownEvent(e) {
                    if (!input.prop("readonly")) {
                        var pos, begin, end, k = e.which || e.keyCode;
                        oldVal = input.val(), 8 === k || 46 === k || iPhone && 127 === k ? (pos = input.caret(),
                        begin = pos.begin, end = pos.end, end - begin === 0 && (begin = 46 !== k ? seekPrev(begin) : end = seekNext(begin - 1),
                        end = 46 === k ? seekNext(end) : end), clearBuffer(begin, end), shiftL(begin, end - 1),
                        e.preventDefault()) : 13 === k ? blurEvent.call(this, e) : 27 === k && (input.val(focusText),
                        input.caret(0, checkVal()), e.preventDefault());
                    }
                }
                function keypressEvent(e) {
                    if (!input.prop("readonly")) {
                        var p, c, next, k = e.which || e.keyCode, pos = input.caret();
                        if (!(e.ctrlKey || e.altKey || e.metaKey || 32 > k) && k && 13 !== k) {
                            if (pos.end - pos.begin !== 0 && (clearBuffer(pos.begin, pos.end), shiftL(pos.begin, pos.end - 1)),
                            p = seekNext(pos.begin - 1), len > p && (c = String.fromCharCode(k), tests[p].test(c))) {
                                if (shiftR(p), buffer[p] = c, writeBuffer(), next = seekNext(p), android) {
                                    var proxy = function() {
                                        $.proxy($.fn.caret, input, next)();
                                    };
                                    setTimeout(proxy, 0);
                                } else input.caret(next);
                                pos.begin <= lastRequiredNonMaskPos && tryFireCompleted();
                            }
                            e.preventDefault();
                        }
                    }
                }
                function clearBuffer(start, end) {
                    var i;
                    for (i = start; end > i && len > i; i++) tests[i] && (buffer[i] = getPlaceholder(i));
                }
                function writeBuffer() {
                    input.val(buffer.join(""));
                }
                function checkVal(allow) {
                    var i, c, pos, test = input.val(), lastMatch = -1;
                    for (i = 0, pos = 0; len > i; i++) if (tests[i]) {
                        for (buffer[i] = getPlaceholder(i); pos++ < test.length; ) if (c = test.charAt(pos - 1),
                        tests[i].test(c)) {
                            buffer[i] = c, lastMatch = i;
                            break;
                        }
                        if (pos > test.length) {
                            clearBuffer(i + 1, len);
                            break;
                        }
                    } else buffer[i] === test.charAt(pos) && pos++, partialPosition > i && (lastMatch = i);
                    return allow ? writeBuffer() : partialPosition > lastMatch + 1 ? settings.autoclear || buffer.join("") === defaultBuffer ? (input.val() && input.val(""),
                    clearBuffer(0, len)) : writeBuffer() : (writeBuffer(), input.val(input.val().substring(0, lastMatch + 1))),
                    partialPosition ? i : firstNonMaskPos;
                }
                var input = $(this), buffer = $.map(mask.split(""), function(c, i) {
                    return "?" != c ? defs[c] ? getPlaceholder(i) : c : void 0;
                }), defaultBuffer = buffer.join(""), focusText = input.val();
                input.data($.mask.dataName, function() {
                    return $.map(buffer, function(c, i) {
                        return tests[i] && c != getPlaceholder(i) ? c : null;
                    }).join("");
                }), input.one("unmask", function() {
                    input.off(".mask").removeData($.mask.dataName);
                }).on("focus.mask", function() {
                    if (!input.prop("readonly")) {
                        clearTimeout(caretTimeoutId);
                        var pos;
                        focusText = input.val(), pos = checkVal(), caretTimeoutId = setTimeout(function() {
                            input.get(0) === document.activeElement && (writeBuffer(), pos == mask.replace("?", "").length ? input.caret(0, pos) : input.caret(pos));
                        }, 10);
                    }
                }).on("blur.mask", blurEvent).on("keydown.mask", keydownEvent).on("keypress.mask", keypressEvent).on("input.mask paste.mask", function() {
                    input.prop("readonly") || setTimeout(function() {
                        var pos = checkVal(!0);
                        input.caret(pos), tryFireCompleted();
                    }, 0);
                }), chrome && android && input.off("input.mask").on("input.mask", androidInputEvent),
                checkVal();
            });
        }
    });
});
//! moment.js
//! version : 2.10.3
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com
!function(a,b){"object"==typeof exports&&"undefined"!=typeof module?module.exports=b():"function"==typeof define&&define.amd?define(b):a.moment=b()}(this,function(){"use strict";function a(){return Dc.apply(null,arguments)}function b(a){Dc=a}function c(a){return"[object Array]"===Object.prototype.toString.call(a)}function d(a){return a instanceof Date||"[object Date]"===Object.prototype.toString.call(a)}function e(a,b){var c,d=[];for(c=0;c<a.length;++c)d.push(b(a[c],c));return d}function f(a,b){return Object.prototype.hasOwnProperty.call(a,b)}function g(a,b){for(var c in b)f(b,c)&&(a[c]=b[c]);return f(b,"toString")&&(a.toString=b.toString),f(b,"valueOf")&&(a.valueOf=b.valueOf),a}function h(a,b,c,d){return za(a,b,c,d,!0).utc()}function i(){return{empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1}}function j(a){return null==a._pf&&(a._pf=i()),a._pf}function k(a){if(null==a._isValid){var b=j(a);a._isValid=!isNaN(a._d.getTime())&&b.overflow<0&&!b.empty&&!b.invalidMonth&&!b.nullInput&&!b.invalidFormat&&!b.userInvalidated,a._strict&&(a._isValid=a._isValid&&0===b.charsLeftOver&&0===b.unusedTokens.length&&void 0===b.bigHour)}return a._isValid}function l(a){var b=h(0/0);return null!=a?g(j(b),a):j(b).userInvalidated=!0,b}function m(a,b){var c,d,e;if("undefined"!=typeof b._isAMomentObject&&(a._isAMomentObject=b._isAMomentObject),"undefined"!=typeof b._i&&(a._i=b._i),"undefined"!=typeof b._f&&(a._f=b._f),"undefined"!=typeof b._l&&(a._l=b._l),"undefined"!=typeof b._strict&&(a._strict=b._strict),"undefined"!=typeof b._tzm&&(a._tzm=b._tzm),"undefined"!=typeof b._isUTC&&(a._isUTC=b._isUTC),"undefined"!=typeof b._offset&&(a._offset=b._offset),"undefined"!=typeof b._pf&&(a._pf=j(b)),"undefined"!=typeof b._locale&&(a._locale=b._locale),Fc.length>0)for(c in Fc)d=Fc[c],e=b[d],"undefined"!=typeof e&&(a[d]=e);return a}function n(b){m(this,b),this._d=new Date(+b._d),Gc===!1&&(Gc=!0,a.updateOffset(this),Gc=!1)}function o(a){return a instanceof n||null!=a&&null!=a._isAMomentObject}function p(a){var b=+a,c=0;return 0!==b&&isFinite(b)&&(c=b>=0?Math.floor(b):Math.ceil(b)),c}function q(a,b,c){var d,e=Math.min(a.length,b.length),f=Math.abs(a.length-b.length),g=0;for(d=0;e>d;d++)(c&&a[d]!==b[d]||!c&&p(a[d])!==p(b[d]))&&g++;return g+f}function r(){}function s(a){return a?a.toLowerCase().replace("_","-"):a}function t(a){for(var b,c,d,e,f=0;f<a.length;){for(e=s(a[f]).split("-"),b=e.length,c=s(a[f+1]),c=c?c.split("-"):null;b>0;){if(d=u(e.slice(0,b).join("-")))return d;if(c&&c.length>=b&&q(e,c,!0)>=b-1)break;b--}f++}return null}function u(a){var b=null;if(!Hc[a]&&"undefined"!=typeof module&&module&&module.exports)try{b=Ec._abbr,require("./locale/"+a),v(b)}catch(c){}return Hc[a]}function v(a,b){var c;return a&&(c="undefined"==typeof b?x(a):w(a,b),c&&(Ec=c)),Ec._abbr}function w(a,b){return null!==b?(b.abbr=a,Hc[a]||(Hc[a]=new r),Hc[a].set(b),v(a),Hc[a]):(delete Hc[a],null)}function x(a){var b;if(a&&a._locale&&a._locale._abbr&&(a=a._locale._abbr),!a)return Ec;if(!c(a)){if(b=u(a))return b;a=[a]}return t(a)}function y(a,b){var c=a.toLowerCase();Ic[c]=Ic[c+"s"]=Ic[b]=a}function z(a){return"string"==typeof a?Ic[a]||Ic[a.toLowerCase()]:void 0}function A(a){var b,c,d={};for(c in a)f(a,c)&&(b=z(c),b&&(d[b]=a[c]));return d}function B(b,c){return function(d){return null!=d?(D(this,b,d),a.updateOffset(this,c),this):C(this,b)}}function C(a,b){return a._d["get"+(a._isUTC?"UTC":"")+b]()}function D(a,b,c){return a._d["set"+(a._isUTC?"UTC":"")+b](c)}function E(a,b){var c;if("object"==typeof a)for(c in a)this.set(c,a[c]);else if(a=z(a),"function"==typeof this[a])return this[a](b);return this}function F(a,b,c){for(var d=""+Math.abs(a),e=a>=0;d.length<b;)d="0"+d;return(e?c?"+":"":"-")+d}function G(a,b,c,d){var e=d;"string"==typeof d&&(e=function(){return this[d]()}),a&&(Mc[a]=e),b&&(Mc[b[0]]=function(){return F(e.apply(this,arguments),b[1],b[2])}),c&&(Mc[c]=function(){return this.localeData().ordinal(e.apply(this,arguments),a)})}function H(a){return a.match(/\[[\s\S]/)?a.replace(/^\[|\]$/g,""):a.replace(/\\/g,"")}function I(a){var b,c,d=a.match(Jc);for(b=0,c=d.length;c>b;b++)Mc[d[b]]?d[b]=Mc[d[b]]:d[b]=H(d[b]);return function(e){var f="";for(b=0;c>b;b++)f+=d[b]instanceof Function?d[b].call(e,a):d[b];return f}}function J(a,b){return a.isValid()?(b=K(b,a.localeData()),Lc[b]||(Lc[b]=I(b)),Lc[b](a)):a.localeData().invalidDate()}function K(a,b){function c(a){return b.longDateFormat(a)||a}var d=5;for(Kc.lastIndex=0;d>=0&&Kc.test(a);)a=a.replace(Kc,c),Kc.lastIndex=0,d-=1;return a}function L(a,b,c){_c[a]="function"==typeof b?b:function(a){return a&&c?c:b}}function M(a,b){return f(_c,a)?_c[a](b._strict,b._locale):new RegExp(N(a))}function N(a){return a.replace("\\","").replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(a,b,c,d,e){return b||c||d||e}).replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function O(a,b){var c,d=b;for("string"==typeof a&&(a=[a]),"number"==typeof b&&(d=function(a,c){c[b]=p(a)}),c=0;c<a.length;c++)ad[a[c]]=d}function P(a,b){O(a,function(a,c,d,e){d._w=d._w||{},b(a,d._w,d,e)})}function Q(a,b,c){null!=b&&f(ad,a)&&ad[a](b,c._a,c,a)}function R(a,b){return new Date(Date.UTC(a,b+1,0)).getUTCDate()}function S(a){return this._months[a.month()]}function T(a){return this._monthsShort[a.month()]}function U(a,b,c){var d,e,f;for(this._monthsParse||(this._monthsParse=[],this._longMonthsParse=[],this._shortMonthsParse=[]),d=0;12>d;d++){if(e=h([2e3,d]),c&&!this._longMonthsParse[d]&&(this._longMonthsParse[d]=new RegExp("^"+this.months(e,"").replace(".","")+"$","i"),this._shortMonthsParse[d]=new RegExp("^"+this.monthsShort(e,"").replace(".","")+"$","i")),c||this._monthsParse[d]||(f="^"+this.months(e,"")+"|^"+this.monthsShort(e,""),this._monthsParse[d]=new RegExp(f.replace(".",""),"i")),c&&"MMMM"===b&&this._longMonthsParse[d].test(a))return d;if(c&&"MMM"===b&&this._shortMonthsParse[d].test(a))return d;if(!c&&this._monthsParse[d].test(a))return d}}function V(a,b){var c;return"string"==typeof b&&(b=a.localeData().monthsParse(b),"number"!=typeof b)?a:(c=Math.min(a.date(),R(a.year(),b)),a._d["set"+(a._isUTC?"UTC":"")+"Month"](b,c),a)}function W(b){return null!=b?(V(this,b),a.updateOffset(this,!0),this):C(this,"Month")}function X(){return R(this.year(),this.month())}function Y(a){var b,c=a._a;return c&&-2===j(a).overflow&&(b=c[cd]<0||c[cd]>11?cd:c[dd]<1||c[dd]>R(c[bd],c[cd])?dd:c[ed]<0||c[ed]>24||24===c[ed]&&(0!==c[fd]||0!==c[gd]||0!==c[hd])?ed:c[fd]<0||c[fd]>59?fd:c[gd]<0||c[gd]>59?gd:c[hd]<0||c[hd]>999?hd:-1,j(a)._overflowDayOfYear&&(bd>b||b>dd)&&(b=dd),j(a).overflow=b),a}function Z(b){a.suppressDeprecationWarnings===!1&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+b)}function $(a,b){var c=!0,d=a+"\n"+(new Error).stack;return g(function(){return c&&(Z(d),c=!1),b.apply(this,arguments)},b)}function _(a,b){kd[a]||(Z(b),kd[a]=!0)}function aa(a){var b,c,d=a._i,e=ld.exec(d);if(e){for(j(a).iso=!0,b=0,c=md.length;c>b;b++)if(md[b][1].exec(d)){a._f=md[b][0]+(e[6]||" ");break}for(b=0,c=nd.length;c>b;b++)if(nd[b][1].exec(d)){a._f+=nd[b][0];break}d.match(Yc)&&(a._f+="Z"),ta(a)}else a._isValid=!1}function ba(b){var c=od.exec(b._i);return null!==c?void(b._d=new Date(+c[1])):(aa(b),void(b._isValid===!1&&(delete b._isValid,a.createFromInputFallback(b))))}function ca(a,b,c,d,e,f,g){var h=new Date(a,b,c,d,e,f,g);return 1970>a&&h.setFullYear(a),h}function da(a){var b=new Date(Date.UTC.apply(null,arguments));return 1970>a&&b.setUTCFullYear(a),b}function ea(a){return fa(a)?366:365}function fa(a){return a%4===0&&a%100!==0||a%400===0}function ga(){return fa(this.year())}function ha(a,b,c){var d,e=c-b,f=c-a.day();return f>e&&(f-=7),e-7>f&&(f+=7),d=Aa(a).add(f,"d"),{week:Math.ceil(d.dayOfYear()/7),year:d.year()}}function ia(a){return ha(a,this._week.dow,this._week.doy).week}function ja(){return this._week.dow}function ka(){return this._week.doy}function la(a){var b=this.localeData().week(this);return null==a?b:this.add(7*(a-b),"d")}function ma(a){var b=ha(this,1,4).week;return null==a?b:this.add(7*(a-b),"d")}function na(a,b,c,d,e){var f,g,h=da(a,0,1).getUTCDay();return h=0===h?7:h,c=null!=c?c:e,f=e-h+(h>d?7:0)-(e>h?7:0),g=7*(b-1)+(c-e)+f+1,{year:g>0?a:a-1,dayOfYear:g>0?g:ea(a-1)+g}}function oa(a){var b=Math.round((this.clone().startOf("day")-this.clone().startOf("year"))/864e5)+1;return null==a?b:this.add(a-b,"d")}function pa(a,b,c){return null!=a?a:null!=b?b:c}function qa(a){var b=new Date;return a._useUTC?[b.getUTCFullYear(),b.getUTCMonth(),b.getUTCDate()]:[b.getFullYear(),b.getMonth(),b.getDate()]}function ra(a){var b,c,d,e,f=[];if(!a._d){for(d=qa(a),a._w&&null==a._a[dd]&&null==a._a[cd]&&sa(a),a._dayOfYear&&(e=pa(a._a[bd],d[bd]),a._dayOfYear>ea(e)&&(j(a)._overflowDayOfYear=!0),c=da(e,0,a._dayOfYear),a._a[cd]=c.getUTCMonth(),a._a[dd]=c.getUTCDate()),b=0;3>b&&null==a._a[b];++b)a._a[b]=f[b]=d[b];for(;7>b;b++)a._a[b]=f[b]=null==a._a[b]?2===b?1:0:a._a[b];24===a._a[ed]&&0===a._a[fd]&&0===a._a[gd]&&0===a._a[hd]&&(a._nextDay=!0,a._a[ed]=0),a._d=(a._useUTC?da:ca).apply(null,f),null!=a._tzm&&a._d.setUTCMinutes(a._d.getUTCMinutes()-a._tzm),a._nextDay&&(a._a[ed]=24)}}function sa(a){var b,c,d,e,f,g,h;b=a._w,null!=b.GG||null!=b.W||null!=b.E?(f=1,g=4,c=pa(b.GG,a._a[bd],ha(Aa(),1,4).year),d=pa(b.W,1),e=pa(b.E,1)):(f=a._locale._week.dow,g=a._locale._week.doy,c=pa(b.gg,a._a[bd],ha(Aa(),f,g).year),d=pa(b.w,1),null!=b.d?(e=b.d,f>e&&++d):e=null!=b.e?b.e+f:f),h=na(c,d,e,g,f),a._a[bd]=h.year,a._dayOfYear=h.dayOfYear}function ta(b){if(b._f===a.ISO_8601)return void aa(b);b._a=[],j(b).empty=!0;var c,d,e,f,g,h=""+b._i,i=h.length,k=0;for(e=K(b._f,b._locale).match(Jc)||[],c=0;c<e.length;c++)f=e[c],d=(h.match(M(f,b))||[])[0],d&&(g=h.substr(0,h.indexOf(d)),g.length>0&&j(b).unusedInput.push(g),h=h.slice(h.indexOf(d)+d.length),k+=d.length),Mc[f]?(d?j(b).empty=!1:j(b).unusedTokens.push(f),Q(f,d,b)):b._strict&&!d&&j(b).unusedTokens.push(f);j(b).charsLeftOver=i-k,h.length>0&&j(b).unusedInput.push(h),j(b).bigHour===!0&&b._a[ed]<=12&&b._a[ed]>0&&(j(b).bigHour=void 0),b._a[ed]=ua(b._locale,b._a[ed],b._meridiem),ra(b),Y(b)}function ua(a,b,c){var d;return null==c?b:null!=a.meridiemHour?a.meridiemHour(b,c):null!=a.isPM?(d=a.isPM(c),d&&12>b&&(b+=12),d||12!==b||(b=0),b):b}function va(a){var b,c,d,e,f;if(0===a._f.length)return j(a).invalidFormat=!0,void(a._d=new Date(0/0));for(e=0;e<a._f.length;e++)f=0,b=m({},a),null!=a._useUTC&&(b._useUTC=a._useUTC),b._f=a._f[e],ta(b),k(b)&&(f+=j(b).charsLeftOver,f+=10*j(b).unusedTokens.length,j(b).score=f,(null==d||d>f)&&(d=f,c=b));g(a,c||b)}function wa(a){if(!a._d){var b=A(a._i);a._a=[b.year,b.month,b.day||b.date,b.hour,b.minute,b.second,b.millisecond],ra(a)}}function xa(a){var b,e=a._i,f=a._f;return a._locale=a._locale||x(a._l),null===e||void 0===f&&""===e?l({nullInput:!0}):("string"==typeof e&&(a._i=e=a._locale.preparse(e)),o(e)?new n(Y(e)):(c(f)?va(a):f?ta(a):d(e)?a._d=e:ya(a),b=new n(Y(a)),b._nextDay&&(b.add(1,"d"),b._nextDay=void 0),b))}function ya(b){var f=b._i;void 0===f?b._d=new Date:d(f)?b._d=new Date(+f):"string"==typeof f?ba(b):c(f)?(b._a=e(f.slice(0),function(a){return parseInt(a,10)}),ra(b)):"object"==typeof f?wa(b):"number"==typeof f?b._d=new Date(f):a.createFromInputFallback(b)}function za(a,b,c,d,e){var f={};return"boolean"==typeof c&&(d=c,c=void 0),f._isAMomentObject=!0,f._useUTC=f._isUTC=e,f._l=c,f._i=a,f._f=b,f._strict=d,xa(f)}function Aa(a,b,c,d){return za(a,b,c,d,!1)}function Ba(a,b){var d,e;if(1===b.length&&c(b[0])&&(b=b[0]),!b.length)return Aa();for(d=b[0],e=1;e<b.length;++e)b[e][a](d)&&(d=b[e]);return d}function Ca(){var a=[].slice.call(arguments,0);return Ba("isBefore",a)}function Da(){var a=[].slice.call(arguments,0);return Ba("isAfter",a)}function Ea(a){var b=A(a),c=b.year||0,d=b.quarter||0,e=b.month||0,f=b.week||0,g=b.day||0,h=b.hour||0,i=b.minute||0,j=b.second||0,k=b.millisecond||0;this._milliseconds=+k+1e3*j+6e4*i+36e5*h,this._days=+g+7*f,this._months=+e+3*d+12*c,this._data={},this._locale=x(),this._bubble()}function Fa(a){return a instanceof Ea}function Ga(a,b){G(a,0,0,function(){var a=this.utcOffset(),c="+";return 0>a&&(a=-a,c="-"),c+F(~~(a/60),2)+b+F(~~a%60,2)})}function Ha(a){var b=(a||"").match(Yc)||[],c=b[b.length-1]||[],d=(c+"").match(td)||["-",0,0],e=+(60*d[1])+p(d[2]);return"+"===d[0]?e:-e}function Ia(b,c){var e,f;return c._isUTC?(e=c.clone(),f=(o(b)||d(b)?+b:+Aa(b))-+e,e._d.setTime(+e._d+f),a.updateOffset(e,!1),e):Aa(b).local();return c._isUTC?Aa(b).zone(c._offset||0):Aa(b).local()}function Ja(a){return 15*-Math.round(a._d.getTimezoneOffset()/15)}function Ka(b,c){var d,e=this._offset||0;return null!=b?("string"==typeof b&&(b=Ha(b)),Math.abs(b)<16&&(b=60*b),!this._isUTC&&c&&(d=Ja(this)),this._offset=b,this._isUTC=!0,null!=d&&this.add(d,"m"),e!==b&&(!c||this._changeInProgress?$a(this,Va(b-e,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,a.updateOffset(this,!0),this._changeInProgress=null)),this):this._isUTC?e:Ja(this)}function La(a,b){return null!=a?("string"!=typeof a&&(a=-a),this.utcOffset(a,b),this):-this.utcOffset()}function Ma(a){return this.utcOffset(0,a)}function Na(a){return this._isUTC&&(this.utcOffset(0,a),this._isUTC=!1,a&&this.subtract(Ja(this),"m")),this}function Oa(){return this._tzm?this.utcOffset(this._tzm):"string"==typeof this._i&&this.utcOffset(Ha(this._i)),this}function Pa(a){return a=a?Aa(a).utcOffset():0,(this.utcOffset()-a)%60===0}function Qa(){return this.utcOffset()>this.clone().month(0).utcOffset()||this.utcOffset()>this.clone().month(5).utcOffset()}function Ra(){if(this._a){var a=this._isUTC?h(this._a):Aa(this._a);return this.isValid()&&q(this._a,a.toArray())>0}return!1}function Sa(){return!this._isUTC}function Ta(){return this._isUTC}function Ua(){return this._isUTC&&0===this._offset}function Va(a,b){var c,d,e,g=a,h=null;return Fa(a)?g={ms:a._milliseconds,d:a._days,M:a._months}:"number"==typeof a?(g={},b?g[b]=a:g.milliseconds=a):(h=ud.exec(a))?(c="-"===h[1]?-1:1,g={y:0,d:p(h[dd])*c,h:p(h[ed])*c,m:p(h[fd])*c,s:p(h[gd])*c,ms:p(h[hd])*c}):(h=vd.exec(a))?(c="-"===h[1]?-1:1,g={y:Wa(h[2],c),M:Wa(h[3],c),d:Wa(h[4],c),h:Wa(h[5],c),m:Wa(h[6],c),s:Wa(h[7],c),w:Wa(h[8],c)}):null==g?g={}:"object"==typeof g&&("from"in g||"to"in g)&&(e=Ya(Aa(g.from),Aa(g.to)),g={},g.ms=e.milliseconds,g.M=e.months),d=new Ea(g),Fa(a)&&f(a,"_locale")&&(d._locale=a._locale),d}function Wa(a,b){var c=a&&parseFloat(a.replace(",","."));return(isNaN(c)?0:c)*b}function Xa(a,b){var c={milliseconds:0,months:0};return c.months=b.month()-a.month()+12*(b.year()-a.year()),a.clone().add(c.months,"M").isAfter(b)&&--c.months,c.milliseconds=+b-+a.clone().add(c.months,"M"),c}function Ya(a,b){var c;return b=Ia(b,a),a.isBefore(b)?c=Xa(a,b):(c=Xa(b,a),c.milliseconds=-c.milliseconds,c.months=-c.months),c}function Za(a,b){return function(c,d){var e,f;return null===d||isNaN(+d)||(_(b,"moment()."+b+"(period, number) is deprecated. Please use moment()."+b+"(number, period)."),f=c,c=d,d=f),c="string"==typeof c?+c:c,e=Va(c,d),$a(this,e,a),this}}function $a(b,c,d,e){var f=c._milliseconds,g=c._days,h=c._months;e=null==e?!0:e,f&&b._d.setTime(+b._d+f*d),g&&D(b,"Date",C(b,"Date")+g*d),h&&V(b,C(b,"Month")+h*d),e&&a.updateOffset(b,g||h)}function _a(a){var b=a||Aa(),c=Ia(b,this).startOf("day"),d=this.diff(c,"days",!0),e=-6>d?"sameElse":-1>d?"lastWeek":0>d?"lastDay":1>d?"sameDay":2>d?"nextDay":7>d?"nextWeek":"sameElse";return this.format(this.localeData().calendar(e,this,Aa(b)))}function ab(){return new n(this)}function bb(a,b){var c;return b=z("undefined"!=typeof b?b:"millisecond"),"millisecond"===b?(a=o(a)?a:Aa(a),+this>+a):(c=o(a)?+a:+Aa(a),c<+this.clone().startOf(b))}function cb(a,b){var c;return b=z("undefined"!=typeof b?b:"millisecond"),"millisecond"===b?(a=o(a)?a:Aa(a),+a>+this):(c=o(a)?+a:+Aa(a),+this.clone().endOf(b)<c)}function db(a,b,c){return this.isAfter(a,c)&&this.isBefore(b,c)}function eb(a,b){var c;return b=z(b||"millisecond"),"millisecond"===b?(a=o(a)?a:Aa(a),+this===+a):(c=+Aa(a),+this.clone().startOf(b)<=c&&c<=+this.clone().endOf(b))}function fb(a){return 0>a?Math.ceil(a):Math.floor(a)}function gb(a,b,c){var d,e,f=Ia(a,this),g=6e4*(f.utcOffset()-this.utcOffset());return b=z(b),"year"===b||"month"===b||"quarter"===b?(e=hb(this,f),"quarter"===b?e/=3:"year"===b&&(e/=12)):(d=this-f,e="second"===b?d/1e3:"minute"===b?d/6e4:"hour"===b?d/36e5:"day"===b?(d-g)/864e5:"week"===b?(d-g)/6048e5:d),c?e:fb(e)}function hb(a,b){var c,d,e=12*(b.year()-a.year())+(b.month()-a.month()),f=a.clone().add(e,"months");return 0>b-f?(c=a.clone().add(e-1,"months"),d=(b-f)/(f-c)):(c=a.clone().add(e+1,"months"),d=(b-f)/(c-f)),-(e+d)}function ib(){return this.clone().locale("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")}function jb(){var a=this.clone().utc();return 0<a.year()&&a.year()<=9999?"function"==typeof Date.prototype.toISOString?this.toDate().toISOString():J(a,"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"):J(a,"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]")}function kb(b){var c=J(this,b||a.defaultFormat);return this.localeData().postformat(c)}function lb(a,b){return this.isValid()?Va({to:this,from:a}).locale(this.locale()).humanize(!b):this.localeData().invalidDate()}function mb(a){return this.from(Aa(),a)}function nb(a,b){return this.isValid()?Va({from:this,to:a}).locale(this.locale()).humanize(!b):this.localeData().invalidDate()}function ob(a){return this.to(Aa(),a)}function pb(a){var b;return void 0===a?this._locale._abbr:(b=x(a),null!=b&&(this._locale=b),this)}function qb(){return this._locale}function rb(a){switch(a=z(a)){case"year":this.month(0);case"quarter":case"month":this.date(1);case"week":case"isoWeek":case"day":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===a&&this.weekday(0),"isoWeek"===a&&this.isoWeekday(1),"quarter"===a&&this.month(3*Math.floor(this.month()/3)),this}function sb(a){return a=z(a),void 0===a||"millisecond"===a?this:this.startOf(a).add(1,"isoWeek"===a?"week":a).subtract(1,"ms")}function tb(){return+this._d-6e4*(this._offset||0)}function ub(){return Math.floor(+this/1e3)}function vb(){return this._offset?new Date(+this):this._d}function wb(){var a=this;return[a.year(),a.month(),a.date(),a.hour(),a.minute(),a.second(),a.millisecond()]}function xb(){return k(this)}function yb(){return g({},j(this))}function zb(){return j(this).overflow}function Ab(a,b){G(0,[a,a.length],0,b)}function Bb(a,b,c){return ha(Aa([a,11,31+b-c]),b,c).week}function Cb(a){var b=ha(this,this.localeData()._week.dow,this.localeData()._week.doy).year;return null==a?b:this.add(a-b,"y")}function Db(a){var b=ha(this,1,4).year;return null==a?b:this.add(a-b,"y")}function Eb(){return Bb(this.year(),1,4)}function Fb(){var a=this.localeData()._week;return Bb(this.year(),a.dow,a.doy)}function Gb(a){return null==a?Math.ceil((this.month()+1)/3):this.month(3*(a-1)+this.month()%3)}function Hb(a,b){if("string"==typeof a)if(isNaN(a)){if(a=b.weekdaysParse(a),"number"!=typeof a)return null}else a=parseInt(a,10);return a}function Ib(a){return this._weekdays[a.day()]}function Jb(a){return this._weekdaysShort[a.day()]}function Kb(a){return this._weekdaysMin[a.day()]}function Lb(a){var b,c,d;for(this._weekdaysParse||(this._weekdaysParse=[]),b=0;7>b;b++)if(this._weekdaysParse[b]||(c=Aa([2e3,1]).day(b),d="^"+this.weekdays(c,"")+"|^"+this.weekdaysShort(c,"")+"|^"+this.weekdaysMin(c,""),this._weekdaysParse[b]=new RegExp(d.replace(".",""),"i")),this._weekdaysParse[b].test(a))return b}function Mb(a){var b=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=a?(a=Hb(a,this.localeData()),this.add(a-b,"d")):b}function Nb(a){var b=(this.day()+7-this.localeData()._week.dow)%7;return null==a?b:this.add(a-b,"d")}function Ob(a){return null==a?this.day()||7:this.day(this.day()%7?a:a-7)}function Pb(a,b){G(a,0,0,function(){return this.localeData().meridiem(this.hours(),this.minutes(),b)})}function Qb(a,b){return b._meridiemParse}function Rb(a){return"p"===(a+"").toLowerCase().charAt(0)}function Sb(a,b,c){return a>11?c?"pm":"PM":c?"am":"AM"}function Tb(a){G(0,[a,3],0,"millisecond")}function Ub(){return this._isUTC?"UTC":""}function Vb(){return this._isUTC?"Coordinated Universal Time":""}function Wb(a){return Aa(1e3*a)}function Xb(){return Aa.apply(null,arguments).parseZone()}function Yb(a,b,c){var d=this._calendar[a];return"function"==typeof d?d.call(b,c):d}function Zb(a){var b=this._longDateFormat[a];return!b&&this._longDateFormat[a.toUpperCase()]&&(b=this._longDateFormat[a.toUpperCase()].replace(/MMMM|MM|DD|dddd/g,function(a){return a.slice(1)}),this._longDateFormat[a]=b),b}function $b(){return this._invalidDate}function _b(a){return this._ordinal.replace("%d",a)}function ac(a){return a}function bc(a,b,c,d){var e=this._relativeTime[c];return"function"==typeof e?e(a,b,c,d):e.replace(/%d/i,a)}function cc(a,b){var c=this._relativeTime[a>0?"future":"past"];return"function"==typeof c?c(b):c.replace(/%s/i,b)}function dc(a){var b,c;for(c in a)b=a[c],"function"==typeof b?this[c]=b:this["_"+c]=b;this._ordinalParseLenient=new RegExp(this._ordinalParse.source+"|"+/\d{1,2}/.source)}function ec(a,b,c,d){var e=x(),f=h().set(d,b);return e[c](f,a)}function fc(a,b,c,d,e){if("number"==typeof a&&(b=a,a=void 0),a=a||"",null!=b)return ec(a,b,c,e);var f,g=[];for(f=0;d>f;f++)g[f]=ec(a,f,c,e);return g}function gc(a,b){return fc(a,b,"months",12,"month")}function hc(a,b){return fc(a,b,"monthsShort",12,"month")}function ic(a,b){return fc(a,b,"weekdays",7,"day")}function jc(a,b){return fc(a,b,"weekdaysShort",7,"day")}function kc(a,b){return fc(a,b,"weekdaysMin",7,"day")}function lc(){var a=this._data;return this._milliseconds=Rd(this._milliseconds),this._days=Rd(this._days),this._months=Rd(this._months),a.milliseconds=Rd(a.milliseconds),a.seconds=Rd(a.seconds),a.minutes=Rd(a.minutes),a.hours=Rd(a.hours),a.months=Rd(a.months),a.years=Rd(a.years),this}function mc(a,b,c,d){var e=Va(b,c);return a._milliseconds+=d*e._milliseconds,a._days+=d*e._days,a._months+=d*e._months,a._bubble()}function nc(a,b){return mc(this,a,b,1)}function oc(a,b){return mc(this,a,b,-1)}function pc(){var a,b,c,d=this._milliseconds,e=this._days,f=this._months,g=this._data,h=0;return g.milliseconds=d%1e3,a=fb(d/1e3),g.seconds=a%60,b=fb(a/60),g.minutes=b%60,c=fb(b/60),g.hours=c%24,e+=fb(c/24),h=fb(qc(e)),e-=fb(rc(h)),f+=fb(e/30),e%=30,h+=fb(f/12),f%=12,g.days=e,g.months=f,g.years=h,this}function qc(a){return 400*a/146097}function rc(a){return 146097*a/400}function sc(a){var b,c,d=this._milliseconds;if(a=z(a),"month"===a||"year"===a)return b=this._days+d/864e5,c=this._months+12*qc(b),"month"===a?c:c/12;switch(b=this._days+Math.round(rc(this._months/12)),a){case"week":return b/7+d/6048e5;case"day":return b+d/864e5;case"hour":return 24*b+d/36e5;case"minute":return 1440*b+d/6e4;case"second":return 86400*b+d/1e3;case"millisecond":return Math.floor(864e5*b)+d;default:throw new Error("Unknown unit "+a)}}function tc(){return this._milliseconds+864e5*this._days+this._months%12*2592e6+31536e6*p(this._months/12)}function uc(a){return function(){return this.as(a)}}function vc(a){return a=z(a),this[a+"s"]()}function wc(a){return function(){return this._data[a]}}function xc(){return fb(this.days()/7)}function yc(a,b,c,d,e){return e.relativeTime(b||1,!!c,a,d)}function zc(a,b,c){var d=Va(a).abs(),e=fe(d.as("s")),f=fe(d.as("m")),g=fe(d.as("h")),h=fe(d.as("d")),i=fe(d.as("M")),j=fe(d.as("y")),k=e<ge.s&&["s",e]||1===f&&["m"]||f<ge.m&&["mm",f]||1===g&&["h"]||g<ge.h&&["hh",g]||1===h&&["d"]||h<ge.d&&["dd",h]||1===i&&["M"]||i<ge.M&&["MM",i]||1===j&&["y"]||["yy",j];return k[2]=b,k[3]=+a>0,k[4]=c,yc.apply(null,k)}function Ac(a,b){return void 0===ge[a]?!1:void 0===b?ge[a]:(ge[a]=b,!0)}function Bc(a){var b=this.localeData(),c=zc(this,!a,b);return a&&(c=b.pastFuture(+this,c)),b.postformat(c)}function Cc(){var a=he(this.years()),b=he(this.months()),c=he(this.days()),d=he(this.hours()),e=he(this.minutes()),f=he(this.seconds()+this.milliseconds()/1e3),g=this.asSeconds();return g?(0>g?"-":"")+"P"+(a?a+"Y":"")+(b?b+"M":"")+(c?c+"D":"")+(d||e||f?"T":"")+(d?d+"H":"")+(e?e+"M":"")+(f?f+"S":""):"P0D"}var Dc,Ec,Fc=a.momentProperties=[],Gc=!1,Hc={},Ic={},Jc=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|x|X|zz?|ZZ?|.)/g,Kc=/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,Lc={},Mc={},Nc=/\d/,Oc=/\d\d/,Pc=/\d{3}/,Qc=/\d{4}/,Rc=/[+-]?\d{6}/,Sc=/\d\d?/,Tc=/\d{1,3}/,Uc=/\d{1,4}/,Vc=/[+-]?\d{1,6}/,Wc=/\d+/,Xc=/[+-]?\d+/,Yc=/Z|[+-]\d\d:?\d\d/gi,Zc=/[+-]?\d+(\.\d{1,3})?/,$c=/[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,_c={},ad={},bd=0,cd=1,dd=2,ed=3,fd=4,gd=5,hd=6;G("M",["MM",2],"Mo",function(){return this.month()+1}),G("MMM",0,0,function(a){return this.localeData().monthsShort(this,a)}),G("MMMM",0,0,function(a){return this.localeData().months(this,a)}),y("month","M"),L("M",Sc),L("MM",Sc,Oc),L("MMM",$c),L("MMMM",$c),O(["M","MM"],function(a,b){b[cd]=p(a)-1}),O(["MMM","MMMM"],function(a,b,c,d){var e=c._locale.monthsParse(a,d,c._strict);null!=e?b[cd]=e:j(c).invalidMonth=a});var id="January_February_March_April_May_June_July_August_September_October_November_December".split("_"),jd="Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),kd={};a.suppressDeprecationWarnings=!1;var ld=/^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,md=[["YYYYYY-MM-DD",/[+-]\d{6}-\d{2}-\d{2}/],["YYYY-MM-DD",/\d{4}-\d{2}-\d{2}/],["GGGG-[W]WW-E",/\d{4}-W\d{2}-\d/],["GGGG-[W]WW",/\d{4}-W\d{2}/],["YYYY-DDD",/\d{4}-\d{3}/]],nd=[["HH:mm:ss.SSSS",/(T| )\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss",/(T| )\d\d:\d\d:\d\d/],["HH:mm",/(T| )\d\d:\d\d/],["HH",/(T| )\d\d/]],od=/^\/?Date\((\-?\d+)/i;a.createFromInputFallback=$("moment construction falls back to js Date. This is discouraged and will be removed in upcoming major release. Please refer to https://github.com/moment/moment/issues/1407 for more info.",function(a){a._d=new Date(a._i+(a._useUTC?" UTC":""))}),G(0,["YY",2],0,function(){return this.year()%100}),G(0,["YYYY",4],0,"year"),G(0,["YYYYY",5],0,"year"),G(0,["YYYYYY",6,!0],0,"year"),y("year","y"),L("Y",Xc),L("YY",Sc,Oc),L("YYYY",Uc,Qc),L("YYYYY",Vc,Rc),L("YYYYYY",Vc,Rc),O(["YYYY","YYYYY","YYYYYY"],bd),O("YY",function(b,c){c[bd]=a.parseTwoDigitYear(b)}),a.parseTwoDigitYear=function(a){return p(a)+(p(a)>68?1900:2e3)};var pd=B("FullYear",!1);G("w",["ww",2],"wo","week"),G("W",["WW",2],"Wo","isoWeek"),y("week","w"),y("isoWeek","W"),L("w",Sc),L("ww",Sc,Oc),L("W",Sc),L("WW",Sc,Oc),P(["w","ww","W","WW"],function(a,b,c,d){b[d.substr(0,1)]=p(a)});var qd={dow:0,doy:6};G("DDD",["DDDD",3],"DDDo","dayOfYear"),y("dayOfYear","DDD"),L("DDD",Tc),L("DDDD",Pc),O(["DDD","DDDD"],function(a,b,c){c._dayOfYear=p(a)}),a.ISO_8601=function(){};var rd=$("moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548",function(){var a=Aa.apply(null,arguments);return this>a?this:a}),sd=$("moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548",function(){var a=Aa.apply(null,arguments);return a>this?this:a});Ga("Z",":"),Ga("ZZ",""),L("Z",Yc),L("ZZ",Yc),O(["Z","ZZ"],function(a,b,c){c._useUTC=!0,c._tzm=Ha(a)});var td=/([\+\-]|\d\d)/gi;a.updateOffset=function(){};var ud=/(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,vd=/^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/;Va.fn=Ea.prototype;var wd=Za(1,"add"),xd=Za(-1,"subtract");a.defaultFormat="YYYY-MM-DDTHH:mm:ssZ";var yd=$("moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.",function(a){return void 0===a?this.localeData():this.locale(a)});G(0,["gg",2],0,function(){return this.weekYear()%100}),G(0,["GG",2],0,function(){return this.isoWeekYear()%100}),Ab("gggg","weekYear"),Ab("ggggg","weekYear"),Ab("GGGG","isoWeekYear"),Ab("GGGGG","isoWeekYear"),y("weekYear","gg"),y("isoWeekYear","GG"),L("G",Xc),L("g",Xc),L("GG",Sc,Oc),L("gg",Sc,Oc),L("GGGG",Uc,Qc),L("gggg",Uc,Qc),L("GGGGG",Vc,Rc),L("ggggg",Vc,Rc),P(["gggg","ggggg","GGGG","GGGGG"],function(a,b,c,d){b[d.substr(0,2)]=p(a)}),P(["gg","GG"],function(b,c,d,e){c[e]=a.parseTwoDigitYear(b)}),G("Q",0,0,"quarter"),y("quarter","Q"),L("Q",Nc),O("Q",function(a,b){b[cd]=3*(p(a)-1)}),G("D",["DD",2],"Do","date"),y("date","D"),L("D",Sc),L("DD",Sc,Oc),L("Do",function(a,b){return a?b._ordinalParse:b._ordinalParseLenient}),O(["D","DD"],dd),O("Do",function(a,b){b[dd]=p(a.match(Sc)[0],10)});var zd=B("Date",!0);G("d",0,"do","day"),G("dd",0,0,function(a){return this.localeData().weekdaysMin(this,a)}),G("ddd",0,0,function(a){return this.localeData().weekdaysShort(this,a)}),G("dddd",0,0,function(a){return this.localeData().weekdays(this,a)}),G("e",0,0,"weekday"),G("E",0,0,"isoWeekday"),y("day","d"),y("weekday","e"),y("isoWeekday","E"),L("d",Sc),L("e",Sc),L("E",Sc),L("dd",$c),L("ddd",$c),L("dddd",$c),P(["dd","ddd","dddd"],function(a,b,c){var d=c._locale.weekdaysParse(a);null!=d?b.d=d:j(c).invalidWeekday=a}),P(["d","e","E"],function(a,b,c,d){b[d]=p(a)});var Ad="Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),Bd="Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),Cd="Su_Mo_Tu_We_Th_Fr_Sa".split("_");G("H",["HH",2],0,"hour"),G("h",["hh",2],0,function(){return this.hours()%12||12}),Pb("a",!0),Pb("A",!1),y("hour","h"),L("a",Qb),L("A",Qb),L("H",Sc),L("h",Sc),L("HH",Sc,Oc),L("hh",Sc,Oc),O(["H","HH"],ed),O(["a","A"],function(a,b,c){c._isPm=c._locale.isPM(a),c._meridiem=a}),O(["h","hh"],function(a,b,c){b[ed]=p(a),j(c).bigHour=!0});var Dd=/[ap]\.?m?\.?/i,Ed=B("Hours",!0);G("m",["mm",2],0,"minute"),y("minute","m"),L("m",Sc),L("mm",Sc,Oc),O(["m","mm"],fd);var Fd=B("Minutes",!1);G("s",["ss",2],0,"second"),y("second","s"),L("s",Sc),L("ss",Sc,Oc),O(["s","ss"],gd);var Gd=B("Seconds",!1);G("S",0,0,function(){return~~(this.millisecond()/100)}),G(0,["SS",2],0,function(){return~~(this.millisecond()/10)}),Tb("SSS"),Tb("SSSS"),y("millisecond","ms"),L("S",Tc,Nc),L("SS",Tc,Oc),L("SSS",Tc,Pc),L("SSSS",Wc),O(["S","SS","SSS","SSSS"],function(a,b){b[hd]=p(1e3*("0."+a))});var Hd=B("Milliseconds",!1);G("z",0,0,"zoneAbbr"),G("zz",0,0,"zoneName");var Id=n.prototype;Id.add=wd,Id.calendar=_a,Id.clone=ab,Id.diff=gb,Id.endOf=sb,Id.format=kb,Id.from=lb,Id.fromNow=mb,Id.to=nb,Id.toNow=ob,Id.get=E,Id.invalidAt=zb,Id.isAfter=bb,Id.isBefore=cb,Id.isBetween=db,Id.isSame=eb,Id.isValid=xb,Id.lang=yd,Id.locale=pb,Id.localeData=qb,Id.max=sd,Id.min=rd,Id.parsingFlags=yb,Id.set=E,Id.startOf=rb,Id.subtract=xd,Id.toArray=wb,Id.toDate=vb,Id.toISOString=jb,Id.toJSON=jb,Id.toString=ib,Id.unix=ub,Id.valueOf=tb,Id.year=pd,Id.isLeapYear=ga,Id.weekYear=Cb,Id.isoWeekYear=Db,Id.quarter=Id.quarters=Gb,Id.month=W,Id.daysInMonth=X,Id.week=Id.weeks=la,Id.isoWeek=Id.isoWeeks=ma,Id.weeksInYear=Fb,Id.isoWeeksInYear=Eb,Id.date=zd,Id.day=Id.days=Mb,Id.weekday=Nb,Id.isoWeekday=Ob,Id.dayOfYear=oa,Id.hour=Id.hours=Ed,Id.minute=Id.minutes=Fd,Id.second=Id.seconds=Gd,Id.millisecond=Id.milliseconds=Hd,Id.utcOffset=Ka,Id.utc=Ma,Id.local=Na,Id.parseZone=Oa,Id.hasAlignedHourOffset=Pa,Id.isDST=Qa,Id.isDSTShifted=Ra,Id.isLocal=Sa,Id.isUtcOffset=Ta,Id.isUtc=Ua,Id.isUTC=Ua,Id.zoneAbbr=Ub,Id.zoneName=Vb,Id.dates=$("dates accessor is deprecated. Use date instead.",zd),Id.months=$("months accessor is deprecated. Use month instead",W),Id.years=$("years accessor is deprecated. Use year instead",pd),Id.zone=$("moment().zone is deprecated, use moment().utcOffset instead. https://github.com/moment/moment/issues/1779",La);var Jd=Id,Kd={sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},Ld={LTS:"h:mm:ss A",LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D, YYYY",LLL:"MMMM D, YYYY LT",LLLL:"dddd, MMMM D, YYYY LT"},Md="Invalid date",Nd="%d",Od=/\d{1,2}/,Pd={future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",
hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},Qd=r.prototype;Qd._calendar=Kd,Qd.calendar=Yb,Qd._longDateFormat=Ld,Qd.longDateFormat=Zb,Qd._invalidDate=Md,Qd.invalidDate=$b,Qd._ordinal=Nd,Qd.ordinal=_b,Qd._ordinalParse=Od,Qd.preparse=ac,Qd.postformat=ac,Qd._relativeTime=Pd,Qd.relativeTime=bc,Qd.pastFuture=cc,Qd.set=dc,Qd.months=S,Qd._months=id,Qd.monthsShort=T,Qd._monthsShort=jd,Qd.monthsParse=U,Qd.week=ia,Qd._week=qd,Qd.firstDayOfYear=ka,Qd.firstDayOfWeek=ja,Qd.weekdays=Ib,Qd._weekdays=Ad,Qd.weekdaysMin=Kb,Qd._weekdaysMin=Cd,Qd.weekdaysShort=Jb,Qd._weekdaysShort=Bd,Qd.weekdaysParse=Lb,Qd.isPM=Rb,Qd._meridiemParse=Dd,Qd.meridiem=Sb,v("en",{ordinalParse:/\d{1,2}(th|st|nd|rd)/,ordinal:function(a){var b=a%10,c=1===p(a%100/10)?"th":1===b?"st":2===b?"nd":3===b?"rd":"th";return a+c}}),a.lang=$("moment.lang is deprecated. Use moment.locale instead.",v),a.langData=$("moment.langData is deprecated. Use moment.localeData instead.",x);var Rd=Math.abs,Sd=uc("ms"),Td=uc("s"),Ud=uc("m"),Vd=uc("h"),Wd=uc("d"),Xd=uc("w"),Yd=uc("M"),Zd=uc("y"),$d=wc("milliseconds"),_d=wc("seconds"),ae=wc("minutes"),be=wc("hours"),ce=wc("days"),de=wc("months"),ee=wc("years"),fe=Math.round,ge={s:45,m:45,h:22,d:26,M:11},he=Math.abs,ie=Ea.prototype;ie.abs=lc,ie.add=nc,ie.subtract=oc,ie.as=sc,ie.asMilliseconds=Sd,ie.asSeconds=Td,ie.asMinutes=Ud,ie.asHours=Vd,ie.asDays=Wd,ie.asWeeks=Xd,ie.asMonths=Yd,ie.asYears=Zd,ie.valueOf=tc,ie._bubble=pc,ie.get=vc,ie.milliseconds=$d,ie.seconds=_d,ie.minutes=ae,ie.hours=be,ie.days=ce,ie.weeks=xc,ie.months=de,ie.years=ee,ie.humanize=Bc,ie.toISOString=Cc,ie.toString=Cc,ie.toJSON=Cc,ie.locale=pb,ie.localeData=qb,ie.toIsoString=$("toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)",Cc),ie.lang=yd,G("X",0,0,"unix"),G("x",0,0,"valueOf"),L("x",Xc),L("X",Zc),O("X",function(a,b,c){c._d=new Date(1e3*parseFloat(a,10))}),O("x",function(a,b,c){c._d=new Date(p(a))}),a.version="2.10.3",b(Aa),a.fn=Jd,a.min=Ca,a.max=Da,a.utc=h,a.unix=Wb,a.months=gc,a.isDate=d,a.locale=v,a.invalid=l,a.duration=Va,a.isMoment=o,a.weekdays=ic,a.parseZone=Xb,a.localeData=x,a.isDuration=Fa,a.monthsShort=hc,a.weekdaysMin=kc,a.defineLocale=w,a.weekdaysShort=jc,a.normalizeUnits=z,a.relativeTimeThreshold=Ac;var je=a;return je});
/**
* @version: 2.1.25
* @author: Dan Grossman http://www.dangrossman.info/
* @copyright: Copyright (c) 2012-2017 Dan Grossman. All rights reserved.
* @license: Licensed under the MIT license. See http://www.opensource.org/licenses/mit-license.php
* @website: http://www.daterangepicker.com/
*/
// Follow the UMD template https://github.com/umdjs/umd/blob/master/templates/returnExportsGlobal.js
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Make globaly available as well
        define(['moment', 'jquery'], function (moment, jquery) {
            if (!jquery.fn) jquery.fn = {}; // webpack server rendering
            return (root.daterangepicker = factory(moment, jquery));
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node / Browserify
        //isomorphic issue
        var jQuery = (typeof window != 'undefined') ? window.jQuery : undefined;
        if (!jQuery) {
            jQuery = require('jquery');
            if (!jQuery.fn) jQuery.fn = {};
        }
        var moment = (typeof window != 'undefined' && typeof window.moment != 'undefined') ? window.moment : require('moment');
        module.exports = factory(moment, jQuery);
    } else {
        // Browser globals
        root.daterangepicker = factory(root.moment, root.jQuery);
    }
}(this, function(moment, $) {
    var DateRangePicker = function(element, options, cb) {

        //default settings for options
        this.parentEl = 'body';
        this.element = $(element);
        this.startDate = moment().startOf('day');
        this.endDate = moment().endOf('day');
        this.minDate = false;
        this.maxDate = false;
        this.dateLimit = false;
        this.autoApply = false;
        this.singleDatePicker = false;
        this.showDropdowns = false;
        this.showWeekNumbers = false;
        this.showISOWeekNumbers = false;
        this.showCustomRangeLabel = true;
        this.timePicker = false;
        this.timePicker24Hour = false;
        this.timePickerIncrement = 1;
        this.timePickerSeconds = false;
        this.linkedCalendars = true;
        this.autoUpdateInput = true;
        this.alwaysShowCalendars = false;
        this.ranges = {};

        this.opens = 'right';
        if (this.element.hasClass('pull-right'))
            this.opens = 'left';

        this.drops = 'down';
        if (this.element.hasClass('dropup'))
            this.drops = 'up';

        this.buttonClasses = 'btn btn-sm';
        this.applyClass = 'btn-success';
        this.cancelClass = 'btn-default';

        this.locale = {
            direction: 'ltr',
            format: moment.localeData().longDateFormat('L'),
            separator: ' - ',
            applyLabel: 'Apply',
            cancelLabel: 'Cancel',
            weekLabel: 'W',
            customRangeLabel: 'Custom Range',
            daysOfWeek: moment.weekdaysMin(),
            monthNames: moment.monthsShort(),
            firstDay: moment.localeData().firstDayOfWeek()
        };

        this.callback = function() { };

        //some state information
        this.isShowing = false;
        this.leftCalendar = {};
        this.rightCalendar = {};

        //custom options from user
        if (typeof options !== 'object' || options === null)
            options = {};

        //allow setting options with data attributes
        //data-api options will be overwritten with custom javascript options
        options = $.extend(this.element.data(), options);

        //html template for the picker UI
        if (typeof options.template !== 'string' && !(options.template instanceof $))
            options.template = '<div class="daterangepicker dropdown-menu">' +
                '<div class="calendar left">' +
                    '<div class="daterangepicker_input">' +
                      '<input class="input-mini form-control" type="text" name="daterangepicker_start" value="" />' +
                      '<i class="fa fa-calendar glyphicon glyphicon-calendar"></i>' +
                      '<div class="calendar-time">' +
                        '<div></div>' +
                        '<i class="fa fa-clock-o glyphicon glyphicon-time"></i>' +
                      '</div>' +
                    '</div>' +
                    '<div class="calendar-table"></div>' +
                '</div>' +
                '<div class="calendar right">' +
                    '<div class="daterangepicker_input">' +
                      '<input class="input-mini form-control" type="text" name="daterangepicker_end" value="" />' +
                      '<i class="fa fa-calendar glyphicon glyphicon-calendar"></i>' +
                      '<div class="calendar-time">' +
                        '<div></div>' +
                        '<i class="fa fa-clock-o glyphicon glyphicon-time"></i>' +
                      '</div>' +
                    '</div>' +
                    '<div class="calendar-table"></div>' +
                '</div>' +
                '<div class="ranges">' +
                    '<div class="range_inputs">' +
                        '<button class="applyBtn" disabled="disabled" type="button"></button> ' +
                        '<button class="cancelBtn" type="button"></button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        this.parentEl = (options.parentEl && $(options.parentEl).length) ? $(options.parentEl) : $(this.parentEl);
        this.container = $(options.template).appendTo(this.parentEl);

        //
        // handle all the possible options overriding defaults
        //

        if (typeof options.locale === 'object') {

            if (typeof options.locale.direction === 'string')
                this.locale.direction = options.locale.direction;

            if (typeof options.locale.format === 'string')
                this.locale.format = options.locale.format;

            if (typeof options.locale.separator === 'string')
                this.locale.separator = options.locale.separator;

            if (typeof options.locale.daysOfWeek === 'object')
                this.locale.daysOfWeek = options.locale.daysOfWeek.slice();

            if (typeof options.locale.monthNames === 'object')
              this.locale.monthNames = options.locale.monthNames.slice();

            if (typeof options.locale.firstDay === 'number')
              this.locale.firstDay = options.locale.firstDay;

            if (typeof options.locale.applyLabel === 'string')
              this.locale.applyLabel = options.locale.applyLabel;

            if (typeof options.locale.cancelLabel === 'string')
              this.locale.cancelLabel = options.locale.cancelLabel;

            if (typeof options.locale.weekLabel === 'string')
              this.locale.weekLabel = options.locale.weekLabel;

            if (typeof options.locale.customRangeLabel === 'string'){
                //Support unicode chars in the custom range name.
                var elem = document.createElement('textarea');
                elem.innerHTML = options.locale.customRangeLabel;
                var rangeHtml = elem.value;
                this.locale.customRangeLabel = rangeHtml;
            }
        }
        this.container.addClass(this.locale.direction);

        if (typeof options.startDate === 'string')
            this.startDate = moment(options.startDate, this.locale.format);

        if (typeof options.endDate === 'string')
            this.endDate = moment(options.endDate, this.locale.format);

        if (typeof options.minDate === 'string')
            this.minDate = moment(options.minDate, this.locale.format);

        if (typeof options.maxDate === 'string')
            this.maxDate = moment(options.maxDate, this.locale.format);

        if (typeof options.startDate === 'object')
            this.startDate = moment(options.startDate);

        if (typeof options.endDate === 'object')
            this.endDate = moment(options.endDate);

        if (typeof options.minDate === 'object')
            this.minDate = moment(options.minDate);

        if (typeof options.maxDate === 'object')
            this.maxDate = moment(options.maxDate);

        // sanity check for bad options
        if (this.minDate && this.startDate.isBefore(this.minDate))
            this.startDate = this.minDate.clone();

        // sanity check for bad options
        if (this.maxDate && this.endDate.isAfter(this.maxDate))
            this.endDate = this.maxDate.clone();

        if (typeof options.applyClass === 'string')
            this.applyClass = options.applyClass;

        if (typeof options.cancelClass === 'string')
            this.cancelClass = options.cancelClass;

        if (typeof options.dateLimit === 'object')
            this.dateLimit = options.dateLimit;

        if (typeof options.opens === 'string')
            this.opens = options.opens;

        if (typeof options.drops === 'string')
            this.drops = options.drops;

        if (typeof options.showWeekNumbers === 'boolean')
            this.showWeekNumbers = options.showWeekNumbers;

        if (typeof options.showISOWeekNumbers === 'boolean')
            this.showISOWeekNumbers = options.showISOWeekNumbers;

        if (typeof options.buttonClasses === 'string')
            this.buttonClasses = options.buttonClasses;

        if (typeof options.buttonClasses === 'object')
            this.buttonClasses = options.buttonClasses.join(' ');

        if (typeof options.showDropdowns === 'boolean')
            this.showDropdowns = options.showDropdowns;

        if (typeof options.showCustomRangeLabel === 'boolean')
            this.showCustomRangeLabel = options.showCustomRangeLabel;

        if (typeof options.singleDatePicker === 'boolean') {
            this.singleDatePicker = options.singleDatePicker;
            if (this.singleDatePicker)
                this.endDate = this.startDate.clone();
        }

        if (typeof options.timePicker === 'boolean')
            this.timePicker = options.timePicker;

        if (typeof options.timePickerSeconds === 'boolean')
            this.timePickerSeconds = options.timePickerSeconds;

        if (typeof options.timePickerIncrement === 'number')
            this.timePickerIncrement = options.timePickerIncrement;

        if (typeof options.timePicker24Hour === 'boolean')
            this.timePicker24Hour = options.timePicker24Hour;

        if (typeof options.autoApply === 'boolean')
            this.autoApply = options.autoApply;

        if (typeof options.autoUpdateInput === 'boolean')
            this.autoUpdateInput = options.autoUpdateInput;

        if (typeof options.linkedCalendars === 'boolean')
            this.linkedCalendars = options.linkedCalendars;

        if (typeof options.isInvalidDate === 'function')
            this.isInvalidDate = options.isInvalidDate;

        if (typeof options.isCustomDate === 'function')
            this.isCustomDate = options.isCustomDate;

        if (typeof options.alwaysShowCalendars === 'boolean')
            this.alwaysShowCalendars = options.alwaysShowCalendars;

        // update day names order to firstDay
        if (this.locale.firstDay != 0) {
            var iterator = this.locale.firstDay;
            while (iterator > 0) {
                this.locale.daysOfWeek.push(this.locale.daysOfWeek.shift());
                iterator--;
            }
        }

        var start, end, range;

        //if no start/end dates set, check if an input element contains initial values
        if (typeof options.startDate === 'undefined' && typeof options.endDate === 'undefined') {
            if ($(this.element).is('input[type=text]')) {
                var val = $(this.element).val(),
                    split = val.split(this.locale.separator);

                start = end = null;

                if (split.length == 2) {
                    start = moment(split[0], this.locale.format);
                    end = moment(split[1], this.locale.format);
                } else if (this.singleDatePicker && val !== "") {
                    start = moment(val, this.locale.format);
                    end = moment(val, this.locale.format);
                }
                if (start !== null && end !== null) {
                    this.setStartDate(start);
                    this.setEndDate(end);
                }
            }
        }

        if (typeof options.ranges === 'object') {
            for (range in options.ranges) {

                if (typeof options.ranges[range][0] === 'string')
                    start = moment(options.ranges[range][0], this.locale.format);
                else
                    start = moment(options.ranges[range][0]);

                if (typeof options.ranges[range][1] === 'string')
                    end = moment(options.ranges[range][1], this.locale.format);
                else
                    end = moment(options.ranges[range][1]);

                // If the start or end date exceed those allowed by the minDate or dateLimit
                // options, shorten the range to the allowable period.
                if (this.minDate && start.isBefore(this.minDate))
                    start = this.minDate.clone();

                var maxDate = this.maxDate;
                if (this.dateLimit && maxDate && start.clone().add(this.dateLimit).isAfter(maxDate))
                    maxDate = start.clone().add(this.dateLimit);
                if (maxDate && end.isAfter(maxDate))
                    end = maxDate.clone();

                // If the end of the range is before the minimum or the start of the range is
                // after the maximum, don't display this range option at all.
                if ((this.minDate && end.isBefore(this.minDate, this.timepicker ? 'minute' : 'day')) 
                  || (maxDate && start.isAfter(maxDate, this.timepicker ? 'minute' : 'day')))
                    continue;

                //Support unicode chars in the range names.
                var elem = document.createElement('textarea');
                elem.innerHTML = range;
                var rangeHtml = elem.value;

                this.ranges[rangeHtml] = [start, end];
            }

            var list = '<ul>';
            for (range in this.ranges) {
                list += '<li data-range-key="' + range + '">' + range + '</li>';
            }
            if (this.showCustomRangeLabel) {
                list += '<li data-range-key="' + this.locale.customRangeLabel + '">' + this.locale.customRangeLabel + '</li>';
            }
            list += '</ul>';
            this.container.find('.ranges').prepend(list);
        }

        if (typeof cb === 'function') {
            this.callback = cb;
        }

        if (!this.timePicker) {
            this.startDate = this.startDate.startOf('day');
            this.endDate = this.endDate.endOf('day');
            this.container.find('.calendar-time').hide();
        }

        //can't be used together for now
        if (this.timePicker && this.autoApply)
            this.autoApply = false;

        if (this.autoApply && typeof options.ranges !== 'object') {
            this.container.find('.ranges').hide();
        } else if (this.autoApply) {
            this.container.find('.applyBtn, .cancelBtn').addClass('hide');
        }

        if (this.singleDatePicker) {
            this.container.addClass('single');
            this.container.find('.calendar.left').addClass('single');
            this.container.find('.calendar.left').show();
            this.container.find('.calendar.right').hide();
            this.container.find('.daterangepicker_input input, .daterangepicker_input > i').hide();
            if (this.timePicker) {
                this.container.find('.ranges ul').hide();
            } else {
                this.container.find('.ranges').hide();
            }
        }

        if ((typeof options.ranges === 'undefined' && !this.singleDatePicker) || this.alwaysShowCalendars) {
            this.container.addClass('show-calendar');
        }

        this.container.addClass('opens' + this.opens);

        //swap the position of the predefined ranges if opens right
        if (typeof options.ranges !== 'undefined' && this.opens == 'right') {
            this.container.find('.ranges').prependTo( this.container.find('.calendar.left').parent() );
        }

        //apply CSS classes and labels to buttons
        this.container.find('.applyBtn, .cancelBtn').addClass(this.buttonClasses);
        if (this.applyClass.length)
            this.container.find('.applyBtn').addClass(this.applyClass);
        if (this.cancelClass.length)
            this.container.find('.cancelBtn').addClass(this.cancelClass);
        this.container.find('.applyBtn').html(this.locale.applyLabel);
        this.container.find('.cancelBtn').html(this.locale.cancelLabel);

        //
        // event listeners
        //

        this.container.find('.calendar')
            .on('click.daterangepicker', '.prev', $.proxy(this.clickPrev, this))
            .on('click.daterangepicker', '.next', $.proxy(this.clickNext, this))
            .on('mousedown.daterangepicker', 'td.available', $.proxy(this.clickDate, this))
            .on('mouseenter.daterangepicker', 'td.available', $.proxy(this.hoverDate, this))
            .on('mouseleave.daterangepicker', 'td.available', $.proxy(this.updateFormInputs, this))
            .on('change.daterangepicker', 'select.yearselect', $.proxy(this.monthOrYearChanged, this))
            .on('change.daterangepicker', 'select.monthselect', $.proxy(this.monthOrYearChanged, this))
            .on('change.daterangepicker', 'select.hourselect,select.minuteselect,select.secondselect,select.ampmselect', $.proxy(this.timeChanged, this))
            .on('click.daterangepicker', '.daterangepicker_input input', $.proxy(this.showCalendars, this))
            .on('focus.daterangepicker', '.daterangepicker_input input', $.proxy(this.formInputsFocused, this))
            .on('blur.daterangepicker', '.daterangepicker_input input', $.proxy(this.formInputsBlurred, this))
            .on('change.daterangepicker', '.daterangepicker_input input', $.proxy(this.formInputsChanged, this));

        this.container.find('.ranges')
            .on('click.daterangepicker', 'button.applyBtn', $.proxy(this.clickApply, this))
            .on('click.daterangepicker', 'button.cancelBtn', $.proxy(this.clickCancel, this))
            .on('click.daterangepicker', 'li', $.proxy(this.clickRange, this))
            .on('mouseenter.daterangepicker', 'li', $.proxy(this.hoverRange, this))
            .on('mouseleave.daterangepicker', 'li', $.proxy(this.updateFormInputs, this));

        if (this.element.is('input') || this.element.is('button')) {
            this.element.on({
                'click.daterangepicker': $.proxy(this.show, this),
                'focus.daterangepicker': $.proxy(this.show, this),
                'keyup.daterangepicker': $.proxy(this.elementChanged, this),
                'keydown.daterangepicker': $.proxy(this.keydown, this)
            });
        } else {
            this.element.on('click.daterangepicker', $.proxy(this.toggle, this));
        }

        //
        // if attached to a text input, set the initial value
        //

        if (this.element.is('input') && !this.singleDatePicker && this.autoUpdateInput) {
            this.element.val(this.startDate.format(this.locale.format) + this.locale.separator + this.endDate.format(this.locale.format));
            this.element.trigger('change');
        } else if (this.element.is('input') && this.autoUpdateInput) {
            this.element.val(this.startDate.format(this.locale.format));
            this.element.trigger('change');
        }

    };

    DateRangePicker.prototype = {

        constructor: DateRangePicker,

        setStartDate: function(startDate) {
            if (typeof startDate === 'string')
                this.startDate = moment(startDate, this.locale.format);

            if (typeof startDate === 'object')
                this.startDate = moment(startDate);

            if (!this.timePicker)
                this.startDate = this.startDate.startOf('day');

            if (this.timePicker && this.timePickerIncrement)
                this.startDate.minute(Math.round(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);

            if (this.minDate && this.startDate.isBefore(this.minDate)) {
                this.startDate = this.minDate.clone();
                if (this.timePicker && this.timePickerIncrement)
                    this.startDate.minute(Math.round(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
            }

            if (this.maxDate && this.startDate.isAfter(this.maxDate)) {
                this.startDate = this.maxDate.clone();
                if (this.timePicker && this.timePickerIncrement)
                    this.startDate.minute(Math.floor(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
            }

            if (!this.isShowing)
                this.updateElement();

            this.updateMonthsInView();
        },

        setEndDate: function(endDate) {
            if (typeof endDate === 'string')
                this.endDate = moment(endDate, this.locale.format);

            if (typeof endDate === 'object')
                this.endDate = moment(endDate);

            if (!this.timePicker)
                this.endDate = this.endDate.endOf('day');

            if (this.timePicker && this.timePickerIncrement)
                this.endDate.minute(Math.round(this.endDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);

            if (this.endDate.isBefore(this.startDate))
                this.endDate = this.startDate.clone();

            if (this.maxDate && this.endDate.isAfter(this.maxDate))
                this.endDate = this.maxDate.clone();

            if (this.dateLimit && this.startDate.clone().add(this.dateLimit).isBefore(this.endDate))
                this.endDate = this.startDate.clone().add(this.dateLimit);

            this.previousRightTime = this.endDate.clone();

            if (!this.isShowing)
                this.updateElement();

            this.updateMonthsInView();
        },

        isInvalidDate: function() {
            return false;
        },

        isCustomDate: function() {
            return false;
        },

        updateView: function() {
            if (this.timePicker) {
                this.renderTimePicker('left');
                this.renderTimePicker('right');
                if (!this.endDate) {
                    this.container.find('.right .calendar-time select').attr('disabled', 'disabled').addClass('disabled');
                } else {
                    this.container.find('.right .calendar-time select').removeAttr('disabled').removeClass('disabled');
                }
            }
            if (this.endDate) {
                this.container.find('input[name="daterangepicker_end"]').removeClass('active');
                this.container.find('input[name="daterangepicker_start"]').addClass('active');
            } else {
                this.container.find('input[name="daterangepicker_end"]').addClass('active');
                this.container.find('input[name="daterangepicker_start"]').removeClass('active');
            }
            this.updateMonthsInView();
            this.updateCalendars();
            this.updateFormInputs();
        },

        updateMonthsInView: function() {
            if (this.endDate) {

                //if both dates are visible already, do nothing
                if (!this.singleDatePicker && this.leftCalendar.month && this.rightCalendar.month &&
                    (this.startDate.format('YYYY-MM') == this.leftCalendar.month.format('YYYY-MM') || this.startDate.format('YYYY-MM') == this.rightCalendar.month.format('YYYY-MM'))
                    &&
                    (this.endDate.format('YYYY-MM') == this.leftCalendar.month.format('YYYY-MM') || this.endDate.format('YYYY-MM') == this.rightCalendar.month.format('YYYY-MM'))
                    ) {
                    return;
                }

                this.leftCalendar.month = this.startDate.clone().date(2);
                if (!this.linkedCalendars && (this.endDate.month() != this.startDate.month() || this.endDate.year() != this.startDate.year())) {
                    this.rightCalendar.month = this.endDate.clone().date(2);
                } else {
                    this.rightCalendar.month = this.startDate.clone().date(2).add(1, 'month');
                }

            } else {
                if (this.leftCalendar.month.format('YYYY-MM') != this.startDate.format('YYYY-MM') && this.rightCalendar.month.format('YYYY-MM') != this.startDate.format('YYYY-MM')) {
                    this.leftCalendar.month = this.startDate.clone().date(2);
                    this.rightCalendar.month = this.startDate.clone().date(2).add(1, 'month');
                }
            }
            if (this.maxDate && this.linkedCalendars && !this.singleDatePicker && this.rightCalendar.month > this.maxDate) {
              this.rightCalendar.month = this.maxDate.clone().date(2);
              this.leftCalendar.month = this.maxDate.clone().date(2).subtract(1, 'month');
            }
        },

        updateCalendars: function() {

            if (this.timePicker) {
                var hour, minute, second;
                if (this.endDate) {
                    hour = parseInt(this.container.find('.left .hourselect').val(), 10);
                    minute = parseInt(this.container.find('.left .minuteselect').val(), 10);
                    second = this.timePickerSeconds ? parseInt(this.container.find('.left .secondselect').val(), 10) : 0;
                    if (!this.timePicker24Hour) {
                        var ampm = this.container.find('.left .ampmselect').val();
                        if (ampm === 'PM' && hour < 12)
                            hour += 12;
                        if (ampm === 'AM' && hour === 12)
                            hour = 0;
                    }
                } else {
                    hour = parseInt(this.container.find('.right .hourselect').val(), 10);
                    minute = parseInt(this.container.find('.right .minuteselect').val(), 10);
                    second = this.timePickerSeconds ? parseInt(this.container.find('.right .secondselect').val(), 10) : 0;
                    if (!this.timePicker24Hour) {
                        var ampm = this.container.find('.right .ampmselect').val();
                        if (ampm === 'PM' && hour < 12)
                            hour += 12;
                        if (ampm === 'AM' && hour === 12)
                            hour = 0;
                    }
                }
                this.leftCalendar.month.hour(hour).minute(minute).second(second);
                this.rightCalendar.month.hour(hour).minute(minute).second(second);
            }

            this.renderCalendar('left');
            this.renderCalendar('right');

            //highlight any predefined range matching the current start and end dates
            this.container.find('.ranges li').removeClass('active');
            if (this.endDate == null) return;

            this.calculateChosenLabel();
        },

        renderCalendar: function(side) {

            //
            // Build the matrix of dates that will populate the calendar
            //

            var calendar = side == 'left' ? this.leftCalendar : this.rightCalendar;
            var month = calendar.month.month();
            var year = calendar.month.year();
            var hour = calendar.month.hour();
            var minute = calendar.month.minute();
            var second = calendar.month.second();
            var daysInMonth = moment([year, month]).daysInMonth();
            var firstDay = moment([year, month, 1]);
            var lastDay = moment([year, month, daysInMonth]);
            var lastMonth = moment(firstDay).subtract(1, 'month').month();
            var lastYear = moment(firstDay).subtract(1, 'month').year();
            var daysInLastMonth = moment([lastYear, lastMonth]).daysInMonth();
            var dayOfWeek = firstDay.day();

            //initialize a 6 rows x 7 columns array for the calendar
            var calendar = [];
            calendar.firstDay = firstDay;
            calendar.lastDay = lastDay;

            for (var i = 0; i < 6; i++) {
                calendar[i] = [];
            }

            //populate the calendar with date objects
            var startDay = daysInLastMonth - dayOfWeek + this.locale.firstDay + 1;
            if (startDay > daysInLastMonth)
                startDay -= 7;

            if (dayOfWeek == this.locale.firstDay)
                startDay = daysInLastMonth - 6;

            var curDate = moment([lastYear, lastMonth, startDay, 12, minute, second]);

            var col, row;
            for (var i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = moment(curDate).add(24, 'hour')) {
                if (i > 0 && col % 7 === 0) {
                    col = 0;
                    row++;
                }
                calendar[row][col] = curDate.clone().hour(hour).minute(minute).second(second);
                curDate.hour(12);

                if (this.minDate && calendar[row][col].format('YYYY-MM-DD') == this.minDate.format('YYYY-MM-DD') && calendar[row][col].isBefore(this.minDate) && side == 'left') {
                    calendar[row][col] = this.minDate.clone();
                }

                if (this.maxDate && calendar[row][col].format('YYYY-MM-DD') == this.maxDate.format('YYYY-MM-DD') && calendar[row][col].isAfter(this.maxDate) && side == 'right') {
                    calendar[row][col] = this.maxDate.clone();
                }

            }

            //make the calendar object available to hoverDate/clickDate
            if (side == 'left') {
                this.leftCalendar.calendar = calendar;
            } else {
                this.rightCalendar.calendar = calendar;
            }

            //
            // Display the calendar
            //

            var minDate = side == 'left' ? this.minDate : this.startDate;
            var maxDate = this.maxDate;
            var selected = side == 'left' ? this.startDate : this.endDate;
            var arrow = this.locale.direction == 'ltr' ? {left: 'chevron-left', right: 'chevron-right'} : {left: 'chevron-right', right: 'chevron-left'};

            var html = '<table class="table-condensed">';
            html += '<thead>';
            html += '<tr>';

            // add empty cell for week number
            if (this.showWeekNumbers || this.showISOWeekNumbers)
                html += '<th></th>';

            if ((!minDate || minDate.isBefore(calendar.firstDay)) && (!this.linkedCalendars || side == 'left')) {
                html += '<th class="prev available"><i class="fa fa-' + arrow.left + ' glyphicon glyphicon-' + arrow.left + '"></i></th>';
            } else {
                html += '<th></th>';
            }

            var dateHtml = this.locale.monthNames[calendar[1][1].month()] + calendar[1][1].format(" YYYY");

            if (this.showDropdowns) {
                var currentMonth = calendar[1][1].month();
                var currentYear = calendar[1][1].year();
                var maxYear = (maxDate && maxDate.year()) || (currentYear + 5);
                var minYear = (minDate && minDate.year()) || (currentYear - 50);
                var inMinYear = currentYear == minYear;
                var inMaxYear = currentYear == maxYear;

                var monthHtml = '<select class="monthselect">';
                for (var m = 0; m < 12; m++) {
                    if ((!inMinYear || m >= minDate.month()) && (!inMaxYear || m <= maxDate.month())) {
                        monthHtml += "<option value='" + m + "'" +
                            (m === currentMonth ? " selected='selected'" : "") +
                            ">" + this.locale.monthNames[m] + "</option>";
                    } else {
                        monthHtml += "<option value='" + m + "'" +
                            (m === currentMonth ? " selected='selected'" : "") +
                            " disabled='disabled'>" + this.locale.monthNames[m] + "</option>";
                    }
                }
                monthHtml += "</select>";

                var yearHtml = '<select class="yearselect">';
                for (var y = minYear; y <= maxYear; y++) {
                    yearHtml += '<option value="' + y + '"' +
                        (y === currentYear ? ' selected="selected"' : '') +
                        '>' + y + '</option>';
                }
                yearHtml += '</select>';

                dateHtml = monthHtml + yearHtml;
            }

            html += '<th colspan="5" class="month">' + dateHtml + '</th>';
            if ((!maxDate || maxDate.isAfter(calendar.lastDay)) && (!this.linkedCalendars || side == 'right' || this.singleDatePicker)) {
                html += '<th class="next available"><i class="fa fa-' + arrow.right + ' glyphicon glyphicon-' + arrow.right + '"></i></th>';
            } else {
                html += '<th></th>';
            }

            html += '</tr>';
            html += '<tr>';

            // add week number label
            if (this.showWeekNumbers || this.showISOWeekNumbers)
                html += '<th class="week">' + this.locale.weekLabel + '</th>';

            $.each(this.locale.daysOfWeek, function(index, dayOfWeek) {
                html += '<th>' + dayOfWeek + '</th>';
            });

            html += '</tr>';
            html += '</thead>';
            html += '<tbody>';

            //adjust maxDate to reflect the dateLimit setting in order to
            //grey out end dates beyond the dateLimit
            if (this.endDate == null && this.dateLimit) {
                var maxLimit = this.startDate.clone().add(this.dateLimit).endOf('day');
                if (!maxDate || maxLimit.isBefore(maxDate)) {
                    maxDate = maxLimit;
                }
            }

            for (var row = 0; row < 6; row++) {
                html += '<tr>';

                // add week number
                if (this.showWeekNumbers)
                    html += '<td class="week">' + calendar[row][0].week() + '</td>';
                else if (this.showISOWeekNumbers)
                    html += '<td class="week">' + calendar[row][0].isoWeek() + '</td>';

                for (var col = 0; col < 7; col++) {

                    var classes = [];

                    //highlight today's date
                    if (calendar[row][col].isSame(new Date(), "day"))
                        classes.push('today');

                    //highlight weekends
                    if (calendar[row][col].isoWeekday() > 5)
                        classes.push('weekend');

                    //grey out the dates in other months displayed at beginning and end of this calendar
                    if (calendar[row][col].month() != calendar[1][1].month())
                        classes.push('off');

                    //don't allow selection of dates before the minimum date
                    if (this.minDate && calendar[row][col].isBefore(this.minDate, 'day'))
                        classes.push('off', 'disabled');

                    //don't allow selection of dates after the maximum date
                    if (maxDate && calendar[row][col].isAfter(maxDate, 'day'))
                        classes.push('off', 'disabled');

                    //don't allow selection of date if a custom function decides it's invalid
                    if (this.isInvalidDate(calendar[row][col]))
                        classes.push('off', 'disabled');

                    //highlight the currently selected start date
                    if (calendar[row][col].format('YYYY-MM-DD') == this.startDate.format('YYYY-MM-DD'))
                        classes.push('active', 'start-date');

                    //highlight the currently selected end date
                    if (this.endDate != null && calendar[row][col].format('YYYY-MM-DD') == this.endDate.format('YYYY-MM-DD'))
                        classes.push('active', 'end-date');

                    //highlight dates in-between the selected dates
                    if (this.endDate != null && calendar[row][col] > this.startDate && calendar[row][col] < this.endDate)
                        classes.push('in-range');

                    //apply custom classes for this date
                    var isCustom = this.isCustomDate(calendar[row][col]);
                    if (isCustom !== false) {
                        if (typeof isCustom === 'string')
                            classes.push(isCustom);
                        else
                            Array.prototype.push.apply(classes, isCustom);
                    }

                    var cname = '', disabled = false;
                    for (var i = 0; i < classes.length; i++) {
                        cname += classes[i] + ' ';
                        if (classes[i] == 'disabled')
                            disabled = true;
                    }
                    if (!disabled)
                        cname += 'available';

                    html += '<td class="' + cname.replace(/^\s+|\s+$/g, '') + '" data-title="' + 'r' + row + 'c' + col + '">' + calendar[row][col].date() + '</td>';

                }
                html += '</tr>';
            }

            html += '</tbody>';
            html += '</table>';

            this.container.find('.calendar.' + side + ' .calendar-table').html(html);

        },

        renderTimePicker: function(side) {

            // Don't bother updating the time picker if it's currently disabled
            // because an end date hasn't been clicked yet
            if (side == 'right' && !this.endDate) return;

            var html, selected, minDate, maxDate = this.maxDate;

            if (this.dateLimit && (!this.maxDate || this.startDate.clone().add(this.dateLimit).isAfter(this.maxDate)))
                maxDate = this.startDate.clone().add(this.dateLimit);

            if (side == 'left') {
                selected = this.startDate.clone();
                minDate = this.minDate;
            } else if (side == 'right') {
                selected = this.endDate.clone();
                minDate = this.startDate;

                //Preserve the time already selected
                var timeSelector = this.container.find('.calendar.right .calendar-time div');
                if (timeSelector.html() != '') {

                    selected.hour(timeSelector.find('.hourselect option:selected').val() || selected.hour());
                    selected.minute(timeSelector.find('.minuteselect option:selected').val() || selected.minute());
                    selected.second(timeSelector.find('.secondselect option:selected').val() || selected.second());

                    if (!this.timePicker24Hour) {
                        var ampm = timeSelector.find('.ampmselect option:selected').val();
                        if (ampm === 'PM' && selected.hour() < 12)
                            selected.hour(selected.hour() + 12);
                        if (ampm === 'AM' && selected.hour() === 12)
                            selected.hour(0);
                    }

                }

                if (selected.isBefore(this.startDate))
                    selected = this.startDate.clone();

                if (maxDate && selected.isAfter(maxDate))
                    selected = maxDate.clone();

            }

            //
            // hours
            //

            html = '<select class="hourselect">';

            var start = this.timePicker24Hour ? 0 : 1;
            var end = this.timePicker24Hour ? 23 : 12;

            for (var i = start; i <= end; i++) {
                var i_in_24 = i;
                if (!this.timePicker24Hour)
                    i_in_24 = selected.hour() >= 12 ? (i == 12 ? 12 : i + 12) : (i == 12 ? 0 : i);

                var time = selected.clone().hour(i_in_24);
                var disabled = false;
                if (minDate && time.minute(59).isBefore(minDate))
                    disabled = true;
                if (maxDate && time.minute(0).isAfter(maxDate))
                    disabled = true;

                if (i_in_24 == selected.hour() && !disabled) {
                    html += '<option value="' + i + '" selected="selected">' + i + '</option>';
                } else if (disabled) {
                    html += '<option value="' + i + '" disabled="disabled" class="disabled">' + i + '</option>';
                } else {
                    html += '<option value="' + i + '">' + i + '</option>';
                }
            }

            html += '</select> ';

            //
            // minutes
            //

            html += ': <select class="minuteselect">';

            for (var i = 0; i < 60; i += this.timePickerIncrement) {
                var padded = i < 10 ? '0' + i : i;
                var time = selected.clone().minute(i);

                var disabled = false;
                if (minDate && time.second(59).isBefore(minDate))
                    disabled = true;
                if (maxDate && time.second(0).isAfter(maxDate))
                    disabled = true;

                if (selected.minute() == i && !disabled) {
                    html += '<option value="' + i + '" selected="selected">' + padded + '</option>';
                } else if (disabled) {
                    html += '<option value="' + i + '" disabled="disabled" class="disabled">' + padded + '</option>';
                } else {
                    html += '<option value="' + i + '">' + padded + '</option>';
                }
            }

            html += '</select> ';

            //
            // seconds
            //

            if (this.timePickerSeconds) {
                html += ': <select class="secondselect">';

                for (var i = 0; i < 60; i++) {
                    var padded = i < 10 ? '0' + i : i;
                    var time = selected.clone().second(i);

                    var disabled = false;
                    if (minDate && time.isBefore(minDate))
                        disabled = true;
                    if (maxDate && time.isAfter(maxDate))
                        disabled = true;

                    if (selected.second() == i && !disabled) {
                        html += '<option value="' + i + '" selected="selected">' + padded + '</option>';
                    } else if (disabled) {
                        html += '<option value="' + i + '" disabled="disabled" class="disabled">' + padded + '</option>';
                    } else {
                        html += '<option value="' + i + '">' + padded + '</option>';
                    }
                }

                html += '</select> ';
            }

            //
            // AM/PM
            //

            if (!this.timePicker24Hour) {
                html += '<select class="ampmselect">';

                var am_html = '';
                var pm_html = '';

                if (minDate && selected.clone().hour(12).minute(0).second(0).isBefore(minDate))
                    am_html = ' disabled="disabled" class="disabled"';

                if (maxDate && selected.clone().hour(0).minute(0).second(0).isAfter(maxDate))
                    pm_html = ' disabled="disabled" class="disabled"';

                if (selected.hour() >= 12) {
                    html += '<option value="AM"' + am_html + '>AM</option><option value="PM" selected="selected"' + pm_html + '>PM</option>';
                } else {
                    html += '<option value="AM" selected="selected"' + am_html + '>AM</option><option value="PM"' + pm_html + '>PM</option>';
                }

                html += '</select>';
            }

            this.container.find('.calendar.' + side + ' .calendar-time div').html(html);

        },

        updateFormInputs: function() {

            //ignore mouse movements while an above-calendar text input has focus
            if (this.container.find('input[name=daterangepicker_start]').is(":focus") || this.container.find('input[name=daterangepicker_end]').is(":focus"))
                return;

            this.container.find('input[name=daterangepicker_start]').val(this.startDate.format(this.locale.format));
            if (this.endDate)
                this.container.find('input[name=daterangepicker_end]').val(this.endDate.format(this.locale.format));

            if (this.singleDatePicker || (this.endDate && (this.startDate.isBefore(this.endDate) || this.startDate.isSame(this.endDate)))) {
                this.container.find('button.applyBtn').removeAttr('disabled');
            } else {
                this.container.find('button.applyBtn').attr('disabled', 'disabled');
            }

        },

        move: function() {
            var parentOffset = { top: 0, left: 0 },
                containerTop;
            var parentRightEdge = $(window).width();
            if (!this.parentEl.is('body')) {
                parentOffset = {
                    top: this.parentEl.offset().top - this.parentEl.scrollTop(),
                    left: this.parentEl.offset().left - this.parentEl.scrollLeft()
                };
                parentRightEdge = this.parentEl[0].clientWidth + this.parentEl.offset().left;
            }

            if (this.drops == 'up')
                containerTop = this.element.offset().top - this.container.outerHeight() - parentOffset.top;
            else
                containerTop = this.element.offset().top + this.element.outerHeight() - parentOffset.top;
            this.container[this.drops == 'up' ? 'addClass' : 'removeClass']('dropup');

            if (this.opens == 'left') {
                this.container.css({
                    top: containerTop,
                    right: parentRightEdge - this.element.offset().left - this.element.outerWidth(),
                    left: 'auto'
                });
                if (this.container.offset().left < 0) {
                    this.container.css({
                        right: 'auto',
                        left: 9
                    });
                }
            } else if (this.opens == 'center') {
                this.container.css({
                    top: containerTop,
                    left: this.element.offset().left - parentOffset.left + this.element.outerWidth() / 2
                            - this.container.outerWidth() / 2,
                    right: 'auto'
                });
                if (this.container.offset().left < 0) {
                    this.container.css({
                        right: 'auto',
                        left: 9
                    });
                }
            } else {
                this.container.css({
                    top: containerTop,
                    left: this.element.offset().left - parentOffset.left,
                    right: 'auto'
                });
                if (this.container.offset().left + this.container.outerWidth() > $(window).width()) {
                    this.container.css({
                        left: 'auto',
                        right: 0
                    });
                }
            }
        },

        show: function(e) {
            if (this.isShowing) return;

            // Create a click proxy that is private to this instance of datepicker, for unbinding
            this._outsideClickProxy = $.proxy(function(e) { this.outsideClick(e); }, this);

            // Bind global datepicker mousedown for hiding and
            $(document)
              .on('mousedown.daterangepicker', this._outsideClickProxy)
              // also support mobile devices
              .on('touchend.daterangepicker', this._outsideClickProxy)
              // also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
              .on('click.daterangepicker', '[data-toggle=dropdown]', this._outsideClickProxy)
              // and also close when focus changes to outside the picker (eg. tabbing between controls)
              .on('focusin.daterangepicker', this._outsideClickProxy);

            // Reposition the picker if the window is resized while it's open
            $(window).on('resize.daterangepicker', $.proxy(function(e) { this.move(e); }, this));

            this.oldStartDate = this.startDate.clone();
            this.oldEndDate = this.endDate.clone();
            this.previousRightTime = this.endDate.clone();

            this.updateView();
            this.container.show();
            this.move();
            this.element.trigger('show.daterangepicker', this);
            this.isShowing = true;
        },

        hide: function(e) {
            if (!this.isShowing) return;

            //incomplete date selection, revert to last values
            if (!this.endDate) {
                this.startDate = this.oldStartDate.clone();
                this.endDate = this.oldEndDate.clone();
            }

            //if a new date range was selected, invoke the user callback function
            if (!this.startDate.isSame(this.oldStartDate) || !this.endDate.isSame(this.oldEndDate))
                this.callback(this.startDate, this.endDate, this.chosenLabel);

            //if picker is attached to a text input, update it
            this.updateElement();

            $(document).off('.daterangepicker');
            $(window).off('.daterangepicker');
            this.container.hide();
            this.element.trigger('hide.daterangepicker', this);
            this.isShowing = false;
        },

        toggle: function(e) {
            if (this.isShowing) {
                this.hide();
            } else {
                this.show();
            }
        },

        outsideClick: function(e) {
            var target = $(e.target);
            // if the page is clicked anywhere except within the daterangerpicker/button
            // itself then call this.hide()
            if (
                // ie modal dialog fix
                e.type == "focusin" ||
                target.closest(this.element).length ||
                target.closest(this.container).length ||
                target.closest('.calendar-table').length
                ) return;
            this.hide();
            this.element.trigger('outsideClick.daterangepicker', this);
        },

        showCalendars: function() {
            this.container.addClass('show-calendar');
            this.move();
            this.element.trigger('showCalendar.daterangepicker', this);
        },

        hideCalendars: function() {
            this.container.removeClass('show-calendar');
            this.element.trigger('hideCalendar.daterangepicker', this);
        },

        hoverRange: function(e) {

            //ignore mouse movements while an above-calendar text input has focus
            if (this.container.find('input[name=daterangepicker_start]').is(":focus") || this.container.find('input[name=daterangepicker_end]').is(":focus"))
                return;

            var label = e.target.getAttribute('data-range-key');

            if (label == this.locale.customRangeLabel) {
                this.updateView();
            } else {
                var dates = this.ranges[label];
                this.container.find('input[name=daterangepicker_start]').val(dates[0].format(this.locale.format));
                this.container.find('input[name=daterangepicker_end]').val(dates[1].format(this.locale.format));
            }

        },

        clickRange: function(e) {
            var label = e.target.getAttribute('data-range-key');
            this.chosenLabel = label;
            if (label == this.locale.customRangeLabel) {
                this.showCalendars();
            } else {
                var dates = this.ranges[label];
                this.startDate = dates[0];
                this.endDate = dates[1];

                if (!this.timePicker) {
                    this.startDate.startOf('day');
                    this.endDate.endOf('day');
                }

                if (!this.alwaysShowCalendars)
                    this.hideCalendars();
                this.clickApply();
            }
        },

        clickPrev: function(e) {
            var cal = $(e.target).parents('.calendar');
            if (cal.hasClass('left')) {
                this.leftCalendar.month.subtract(1, 'month');
                if (this.linkedCalendars)
                    this.rightCalendar.month.subtract(1, 'month');
            } else {
                this.rightCalendar.month.subtract(1, 'month');
            }
            this.updateCalendars();
        },

        clickNext: function(e) {
            var cal = $(e.target).parents('.calendar');
            if (cal.hasClass('left')) {
                this.leftCalendar.month.add(1, 'month');
            } else {
                this.rightCalendar.month.add(1, 'month');
                if (this.linkedCalendars)
                    this.leftCalendar.month.add(1, 'month');
            }
            this.updateCalendars();
        },

        hoverDate: function(e) {

            //ignore mouse movements while an above-calendar text input has focus
            //if (this.container.find('input[name=daterangepicker_start]').is(":focus") || this.container.find('input[name=daterangepicker_end]').is(":focus"))
            //    return;

            //ignore dates that can't be selected
            if (!$(e.target).hasClass('available')) return;

            //have the text inputs above calendars reflect the date being hovered over
            var title = $(e.target).attr('data-title');
            var row = title.substr(1, 1);
            var col = title.substr(3, 1);
            var cal = $(e.target).parents('.calendar');
            var date = cal.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

            if (this.endDate && !this.container.find('input[name=daterangepicker_start]').is(":focus")) {
                this.container.find('input[name=daterangepicker_start]').val(date.format(this.locale.format));
            } else if (!this.endDate && !this.container.find('input[name=daterangepicker_end]').is(":focus")) {
                this.container.find('input[name=daterangepicker_end]').val(date.format(this.locale.format));
            }

            //highlight the dates between the start date and the date being hovered as a potential end date
            var leftCalendar = this.leftCalendar;
            var rightCalendar = this.rightCalendar;
            var startDate = this.startDate;
            if (!this.endDate) {
                this.container.find('.calendar tbody td').each(function(index, el) {

                    //skip week numbers, only look at dates
                    if ($(el).hasClass('week')) return;

                    var title = $(el).attr('data-title');
                    var row = title.substr(1, 1);
                    var col = title.substr(3, 1);
                    var cal = $(el).parents('.calendar');
                    var dt = cal.hasClass('left') ? leftCalendar.calendar[row][col] : rightCalendar.calendar[row][col];

                    if ((dt.isAfter(startDate) && dt.isBefore(date)) || dt.isSame(date, 'day')) {
                        $(el).addClass('in-range');
                    } else {
                        $(el).removeClass('in-range');
                    }

                });
            }

        },

        clickDate: function(e) {

            if (!$(e.target).hasClass('available')) return;

            var title = $(e.target).attr('data-title');
            var row = title.substr(1, 1);
            var col = title.substr(3, 1);
            var cal = $(e.target).parents('.calendar');
            var date = cal.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

            //
            // this function needs to do a few things:
            // * alternate between selecting a start and end date for the range,
            // * if the time picker is enabled, apply the hour/minute/second from the select boxes to the clicked date
            // * if autoapply is enabled, and an end date was chosen, apply the selection
            // * if single date picker mode, and time picker isn't enabled, apply the selection immediately
            // * if one of the inputs above the calendars was focused, cancel that manual input
            //

            if (this.endDate || date.isBefore(this.startDate, 'day')) { //picking start
                if (this.timePicker) {
                    var hour = parseInt(this.container.find('.left .hourselect').val(), 10);
                    if (!this.timePicker24Hour) {
                        var ampm = this.container.find('.left .ampmselect').val();
                        if (ampm === 'PM' && hour < 12)
                            hour += 12;
                        if (ampm === 'AM' && hour === 12)
                            hour = 0;
                    }
                    var minute = parseInt(this.container.find('.left .minuteselect').val(), 10);
                    var second = this.timePickerSeconds ? parseInt(this.container.find('.left .secondselect').val(), 10) : 0;
                    date = date.clone().hour(hour).minute(minute).second(second);
                }
                this.endDate = null;
                this.setStartDate(date.clone());
            } else if (!this.endDate && date.isBefore(this.startDate)) {
                //special case: clicking the same date for start/end,
                //but the time of the end date is before the start date
                this.setEndDate(this.startDate.clone());
            } else { // picking end
                if (this.timePicker) {
                    var hour = parseInt(this.container.find('.right .hourselect').val(), 10);
                    if (!this.timePicker24Hour) {
                        var ampm = this.container.find('.right .ampmselect').val();
                        if (ampm === 'PM' && hour < 12)
                            hour += 12;
                        if (ampm === 'AM' && hour === 12)
                            hour = 0;
                    }
                    var minute = parseInt(this.container.find('.right .minuteselect').val(), 10);
                    var second = this.timePickerSeconds ? parseInt(this.container.find('.right .secondselect').val(), 10) : 0;
                    date = date.clone().hour(hour).minute(minute).second(second);
                }
                this.setEndDate(date.clone());
                if (this.autoApply) {
                  this.calculateChosenLabel();
                  this.clickApply();
                }
            }

            if (this.singleDatePicker) {
                this.setEndDate(this.startDate);
                if (!this.timePicker)
                    this.clickApply();
            }

            this.updateView();

            //This is to cancel the blur event handler if the mouse was in one of the inputs
            e.stopPropagation();

        },

        calculateChosenLabel: function () {
            var customRange = true;
            var i = 0;
            for (var range in this.ranges) {
                if (this.timePicker) {
                    if (this.startDate.isSame(this.ranges[range][0]) && this.endDate.isSame(this.ranges[range][1])) {
                        customRange = false;
                        this.chosenLabel = this.container.find('.ranges li:eq(' + i + ')').addClass('active').html();
                        break;
                    }
                } else {
                    //ignore times when comparing dates if time picker is not enabled
                    if (this.startDate.format('YYYY-MM-DD') == this.ranges[range][0].format('YYYY-MM-DD') && this.endDate.format('YYYY-MM-DD') == this.ranges[range][1].format('YYYY-MM-DD')) {
                        customRange = false;
                        this.chosenLabel = this.container.find('.ranges li:eq(' + i + ')').addClass('active').html();
                        break;
                    }
                }
                i++;
            }
            if (customRange) {
                if (this.showCustomRangeLabel) {
                    this.chosenLabel = this.container.find('.ranges li:last').addClass('active').html();
                } else {
                    this.chosenLabel = null;
                }
                this.showCalendars();
            }
        },

        clickApply: function(e) {
            this.hide();
            this.element.trigger('apply.daterangepicker', this);
        },

        clickCancel: function(e) {
            this.startDate = this.oldStartDate;
            this.endDate = this.oldEndDate;
            this.hide();
            this.element.trigger('cancel.daterangepicker', this);
        },

        monthOrYearChanged: function(e) {
            var isLeft = $(e.target).closest('.calendar').hasClass('left'),
                leftOrRight = isLeft ? 'left' : 'right',
                cal = this.container.find('.calendar.'+leftOrRight);

            // Month must be Number for new moment versions
            var month = parseInt(cal.find('.monthselect').val(), 10);
            var year = cal.find('.yearselect').val();

            if (!isLeft) {
                if (year < this.startDate.year() || (year == this.startDate.year() && month < this.startDate.month())) {
                    month = this.startDate.month();
                    year = this.startDate.year();
                }
            }

            if (this.minDate) {
                if (year < this.minDate.year() || (year == this.minDate.year() && month < this.minDate.month())) {
                    month = this.minDate.month();
                    year = this.minDate.year();
                }
            }

            if (this.maxDate) {
                if (year > this.maxDate.year() || (year == this.maxDate.year() && month > this.maxDate.month())) {
                    month = this.maxDate.month();
                    year = this.maxDate.year();
                }
            }

            if (isLeft) {
                this.leftCalendar.month.month(month).year(year);
                if (this.linkedCalendars)
                    this.rightCalendar.month = this.leftCalendar.month.clone().add(1, 'month');
            } else {
                this.rightCalendar.month.month(month).year(year);
                if (this.linkedCalendars)
                    this.leftCalendar.month = this.rightCalendar.month.clone().subtract(1, 'month');
            }
            this.updateCalendars();
        },

        timeChanged: function(e) {

            var cal = $(e.target).closest('.calendar'),
                isLeft = cal.hasClass('left');

            var hour = parseInt(cal.find('.hourselect').val(), 10);
            var minute = parseInt(cal.find('.minuteselect').val(), 10);
            var second = this.timePickerSeconds ? parseInt(cal.find('.secondselect').val(), 10) : 0;

            if (!this.timePicker24Hour) {
                var ampm = cal.find('.ampmselect').val();
                if (ampm === 'PM' && hour < 12)
                    hour += 12;
                if (ampm === 'AM' && hour === 12)
                    hour = 0;
            }

            if (isLeft) {
                var start = this.startDate.clone();
                start.hour(hour);
                start.minute(minute);
                start.second(second);
                this.setStartDate(start);
                if (this.singleDatePicker) {
                    this.endDate = this.startDate.clone();
                } else if (this.endDate && this.endDate.format('YYYY-MM-DD') == start.format('YYYY-MM-DD') && this.endDate.isBefore(start)) {
                    this.setEndDate(start.clone());
                }
            } else if (this.endDate) {
                var end = this.endDate.clone();
                end.hour(hour);
                end.minute(minute);
                end.second(second);
                this.setEndDate(end);
            }

            //update the calendars so all clickable dates reflect the new time component
            this.updateCalendars();

            //update the form inputs above the calendars with the new time
            this.updateFormInputs();

            //re-render the time pickers because changing one selection can affect what's enabled in another
            this.renderTimePicker('left');
            this.renderTimePicker('right');

        },

        formInputsChanged: function(e) {
            var isRight = $(e.target).closest('.calendar').hasClass('right');
            var start = moment(this.container.find('input[name="daterangepicker_start"]').val(), this.locale.format);
            var end = moment(this.container.find('input[name="daterangepicker_end"]').val(), this.locale.format);

            if (start.isValid() && end.isValid()) {

                if (isRight && end.isBefore(start))
                    start = end.clone();

                this.setStartDate(start);
                this.setEndDate(end);

                if (isRight) {
                    this.container.find('input[name="daterangepicker_start"]').val(this.startDate.format(this.locale.format));
                } else {
                    this.container.find('input[name="daterangepicker_end"]').val(this.endDate.format(this.locale.format));
                }

            }

            this.updateView();
        },

        formInputsFocused: function(e) {

            // Highlight the focused input
            this.container.find('input[name="daterangepicker_start"], input[name="daterangepicker_end"]').removeClass('active');
            $(e.target).addClass('active');

            // Set the state such that if the user goes back to using a mouse, 
            // the calendars are aware we're selecting the end of the range, not
            // the start. This allows someone to edit the end of a date range without
            // re-selecting the beginning, by clicking on the end date input then
            // using the calendar.
            var isRight = $(e.target).closest('.calendar').hasClass('right');
            if (isRight) {
                this.endDate = null;
                this.setStartDate(this.startDate.clone());
                this.updateView();
            }

        },

        formInputsBlurred: function(e) {

            // this function has one purpose right now: if you tab from the first
            // text input to the second in the UI, the endDate is nulled so that
            // you can click another, but if you tab out without clicking anything
            // or changing the input value, the old endDate should be retained

            if (!this.endDate) {
                var val = this.container.find('input[name="daterangepicker_end"]').val();
                var end = moment(val, this.locale.format);
                if (end.isValid()) {
                    this.setEndDate(end);
                    this.updateView();
                }
            }

        },

        elementChanged: function() {
            if (!this.element.is('input')) return;
            if (!this.element.val().length) return;
            if (this.element.val().length < this.locale.format.length) return;

            var dateString = this.element.val().split(this.locale.separator),
                start = null,
                end = null;

            if (dateString.length === 2) {
                start = moment(dateString[0], this.locale.format);
                end = moment(dateString[1], this.locale.format);
            }

            if (this.singleDatePicker || start === null || end === null) {
                start = moment(this.element.val(), this.locale.format);
                end = start;
            }

            if (!start.isValid() || !end.isValid()) return;

            this.setStartDate(start);
            this.setEndDate(end);
            this.updateView();
        },

        keydown: function(e) {
            //hide on tab or enter
            if ((e.keyCode === 9) || (e.keyCode === 13)) {
                this.hide();
            }
        },

        updateElement: function() {
            if (this.element.is('input') && !this.singleDatePicker && this.autoUpdateInput) {
                this.element.val(this.startDate.format(this.locale.format) + this.locale.separator + this.endDate.format(this.locale.format));
                this.element.trigger('change');
            } else if (this.element.is('input') && this.autoUpdateInput) {
                this.element.val(this.startDate.format(this.locale.format));
                this.element.trigger('change');
            }
        },

        remove: function() {
            this.container.remove();
            this.element.off('.daterangepicker');
            this.element.removeData();
        }

    };

    $.fn.daterangepicker = function(options, callback) {
        this.each(function() {
            var el = $(this);
            if (el.data('daterangepicker'))
                el.data('daterangepicker').remove();
            el.data('daterangepicker', new DateRangePicker(el, options, callback));
        });
        return this;
    };

    return DateRangePicker;

}));

// Generated by CoffeeScript 1.12.5
var firstStepController;

firstStepController = (function() {
  function firstStepController($http, $scope, $rootScope, $sce, $location, $element, $sceDelegate, $filter, $timeout) {
    this.$http = $http;
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$sce = $sce;
    this.$location = $location;
    this.$element = $element;
    this.$sceDelegate = $sceDelegate;
    this.$filter = $filter;
    this.$timeout = $timeout;
    this.data = {
      aims: {}
    };
    this.val_range = {
      min: 200,
      max: 50000
    };
    this.$scope.$watch((function(_this) {
      return function(newValue, oldValue, scope) {
        return _this.$scope.main.currentStep;
      };
    })(this), (function(_this) {
      return function(newValue, oldValue, scope) {
        _this.$iElement = $(_this.$element);
        newValue = parseInt(newValue);
        if (newValue === 1) {
          return _this.init();
        }
      };
    })(this));
  }

  firstStepController.prototype.card_hover = function($event, card) {
    return this.$scope.cards_first.card_hover = $event.type === "mouseover" ? card : "";
  };

  firstStepController.prototype.selectAllTxt = function($event) {
    return $event.currentTarget.select();
  };

  firstStepController.prototype.chgAmount = function($event) {
    return this.$timeout((function(_this) {
      return function() {
        var ref;
        _this.$scope.$storage.strgData.amount = _this.$scope.$storage.strgData.amount.replace(/[^0-9]+/g, '');
        if (_this.$scope.$storage.strgData.amount) {
          if ((ref = _this.$iElement.find(".ui.range").data("module-amountrange").update) != null) {
            ref.value(_this.$scope.$storage.strgData.amount);
          }
        }
        if (!_this.$scope.$$phase) {
          return _this.$scope.$apply();
        }
      };
    })(this));
  };

  firstStepController.prototype.nextStep = function() {
    var form;
    form = $(this.$element).find(".ui.form");
    form = form.data("module-form");
    if (form && form.is.valid()) {
      this.$scope.main.loading = true;
      this.data.aims = {};
      this.$location.path("/s2");
      if (!this.$scope.$$phase) {
        return this.$scope.$apply();
      }
    } else if (form) {
      return form.validate.form();
    }
  };

  firstStepController.prototype.update = function() {
    var _dropdown;
    _dropdown = this.$iElement.find(".ui.dropdown").dropdown({
      onChange: (function(_this) {
        return function(value, text, $selectedItem) {
          return _this.$scope.$storage.strgData.aims = value;
        };
      })(this)
    });
    if (this.$scope.$storage.strgData.aims) {
      this.$timeout((function(_this) {
        return function() {
          return _dropdown.data("module-dropdown").set.selected(_this.$scope.$storage.strgData.aims);
        };
      })(this));
    }
    this.changeAmount = (function(_this) {
      return function(v) {
        return _this.$timeout(function() {
          var _el;
          _this.$scope.$storage.strgData.amount = v;
          _el = _this.$iElement.find("[name='amount']");
          if (_el.length) {
            _el = angular.element(_el);
          }
          if (typeof _el.val === "function") {
            _el.val(v);
          }
          return typeof _el.triggerHandler === "function" ? _el.triggerHandler("change") : void 0;
        });
      };
    })(this);
    this.$iElement.find(".ui.range").range({
      min: this.val_range.min,
      max: this.val_range.max,
      start: this.$scope.$storage.strgData.amount,
      step: 100,
      smooth: true,
      name: 'AmountRange',
      namespace: 'amountrange',
      onChange: (function(_this) {
        return function(v, meta) {
          return _this.changeAmount(v);
        };
      })(this),
      onMove: (function(_this) {
        return function(v, meta) {
          return _this.changeAmount(v);
        };
      })(this)
    });
    $(this.$element).find(".ui.form").form({
      inline: true,
      on: "blur",
      fields: {
        aims: {
          identifier: "aims",
          rules: [
            {
              type: "empty",
              prompt: "Выберите цель кредита"
            }
          ]
        },
        amount: {
          identifier: "amount",
          rules: [
            {
              type: "integer[200..50000]",
              prompt: "Сумма кредита должна быть от 200 до 50 000 грн."
            }
          ]
        }
      }
    });
    return this.$scope.main.loading = false;
  };

  firstStepController.prototype.init = function() {
    var params, trustedUrl;
    this.data.aims = {};
    params = {
      data: "aims"
    };
    trustedUrl = this.$sceDelegate.trustAs(this.$sce.RESOURCE_URL, "" + this.$rootScope.settings.api.url + this.$rootScope.settings.api.command.list);
    return this.$http.jsonp(trustedUrl, {
      params: params
    }).then((function(_this) {
      return function(responce) {
        var data;
        data = responce.data;
        if (data.result === 'success' && data.listId === 'aims') {
          _this.data.aims = data.data;
        }
        return _this.update();
      };
    })(this), (function(_this) {
      return function(data, status, headers, config) {
        return _this.update();
      };
    })(this));
  };

  return firstStepController;

})();

// Generated by CoffeeScript 1.12.5
var firstCardsStepController;

firstCardsStepController = (function() {
  function firstCardsStepController($http, $scope, $sce, $window, $element, $attrs) {
    this.$http = $http;
    this.$scope = $scope;
    this.$sce = $sce;
    this.$window = $window;
    this.$element = $element;
    this.$attrs = $attrs;
    this.card_hover = "";
    this.content = [];
    this.content.push({
      icon: "wrench",
      title: "У каждого банка своя специализация",
      text: this.$sce.trustAsHtml("Зная, на что пойдут деньги, мы сможем лучше подобрать вам банк. Мы знаем, какие банки дают кредиты на ремонт, какие - на покупки.")
    });
    this.content.push({
      icon: "wallet",
      title: "Меньше сумма — выше шансы",
      text: this.$sce.trustAsHtml("Чем выше сумма, тем больше требований. Банк может поинтересоваться недвижимостью, автомобилем, или попросить загранпаспорт, чтобы увидеть как часто вы путешествуете. <br /><br /> Получить 100 000 гривен без залога почти нереально. Выберите для себя оптимальную сумму.")
    });
  }

  return firstCardsStepController;

})();

// Generated by CoffeeScript 1.12.5
var twoStepController;

twoStepController = (function() {
  function twoStepController($http, $scope, $rootScope, $sce, $location, $element, $sceDelegate, $filter, $timeout) {
    this.$http = $http;
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$sce = $sce;
    this.$location = $location;
    this.$element = $element;
    this.$sceDelegate = $sceDelegate;
    this.$filter = $filter;
    this.$timeout = $timeout;
    this.calendar = {};
    this.$scope.$watch((function(_this) {
      return function(newValue, oldValue, scope) {
        return _this.$scope.main.currentStep;
      };
    })(this), (function(_this) {
      return function(newValue, oldValue, scope) {
        _this.$iElement = $(_this.$element);
        newValue = parseInt(newValue);
        if (newValue === 2) {
          return _this.init();
        }
      };
    })(this));
  }

  twoStepController.prototype.card_hover = function($event, card) {
    return this.$scope.cards_two.card_hover = $event.type === "mouseover" ? card : "";
  };

  twoStepController.prototype.formatter = function(date) {
    var day, month, year;
    if (!date) {
      return "";
    }
    day = "" + (date.getDate());
    month = "" + (date.getMonth() + 1);
    day = day.length < 2 ? "0" + (date.getDate()) : "" + (date.getDate());
    month = month.length < 2 ? "0" + (date.getMonth() + 1) : "" + (date.getMonth() + 1);
    year = "" + (date.getFullYear());
    return day + "." + month + "." + year;
  };

  twoStepController.prototype.init = function() {
    this.calendar = {};
    this.minDate = new Date();
    this.maxDate = new Date();
    this.maxDate.setFullYear(this.maxDate.getFullYear() - 18);
    this.minDate.setFullYear(this.minDate.getFullYear() - 90);
    this.initCal = (function(_this) {
      return function() {
        _this.calendar = _this.$iElement.find("button.daterange").daterangepicker({
          singleDatePicker: true,
          locale: {
            format: "DD.MM.YYYY",
            separator: " - ",
            applyLabel: "Ок",
            cancelLabel: "Отмена",
            fromLabel: "С",
            toLabel: "По",
            customRangeLabel: "Custom",
            weekLabel: "W",
            daysOfWeek: ['В', 'П', 'В', 'С', 'Ч', 'П', 'С'],
            monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
            firstDay: 1
          },
          opens: "left",
          minDate: _this.formatter(_this.minDate),
          maxDate: _this.formatter(_this.maxDate),
          startDate: _this.$scope.$storage.strgData.bday ? moment(_this.$scope.$storage.strgData.bday, "DD.MM.YYYY").toDate() : _this.minDate
        }, function(start, end, label) {
          var form;
          form = $(_this.$element).find(".ui.form");
          form = form.data("module-form");
          _this.bday = start.format("DD.MM.YYYY");
          _this.$scope.$storage.strgData.bday = start.format("DD.MM.YYYY");
          if (!_this.$scope.$$phase) {
            _this.$scope.$apply();
          }
          if (form && form.is.valid() !== true) {
            return form.validate.form();
          }
        });
        _this.calendar_input = _this.$iElement.find("input[name='bday']").on("change", function(e) {
          return _this.calendar.data("daterangepicker").setStartDate(_this.calendar_input.inputmask("isComplete") ? moment(e.target.value, "DD.MM.YYYY").toDate() : _this.minDate);
        }).inputmask({
          placeholder: "__.__.____",
          alias: "dd.mm.yyyy",
          yearrange: {
            minyear: _this.minDate.getFullYear(),
            maxyear: _this.maxDate.getFullYear()
          },
          greedy: false,
          showMaskOnHover: false
        });
        if (_this.$scope.$storage.strgData.bday) {
          _this.calendar_input.val(_this.$scope.$storage.strgData.bday);
        }
        return _this.initMask();
      };
    })(this);
    return this.$timeout((function(_this) {
      return function() {
        return _this.initCal();
      };
    })(this));
  };

  twoStepController.prototype.prevStep = function() {
    this.$scope.main.$location.path('/s1');
    return this.$scope.main.loading = true;
  };

  twoStepController.prototype.nextStep = function() {
    var form;
    form = $(this.$element).find(".ui.form");
    form = form.data("module-form");
    if (form && form.is.valid()) {
      this.$scope.main.loading = true;
      this.$location.path("/s3");
      if (!this.$scope.$$phase) {
        return this.$scope.$apply();
      }
    } else if (form) {
      return form.validate.form();
    }
  };

  twoStepController.prototype.initMask = function() {
    var _mobMask, _nameMask, _t, alternatCodePhone, alternatCodePhoneMask, code;
    if (this.$scope.$storage.strgData.aggree === void 0) {
      this.$scope.$storage.strgData.aggree = true;
    }
    alternatCodePhone = [39, 50, 63, 66, 67, 68, 73, 91, 92, 93, 94, 95, 96, 97, 98, 99];
    alternatCodePhoneMask = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = alternatCodePhone.length; i < len; i++) {
        code = alternatCodePhone[i];
        results.push({
          mask: "+38 (0" + code + ") ###-##-##",
          cc: "UA",
          cd: "Ukraine"
        });
      }
      return results;
    })();
    _mobMask = $('input[name="phone"]');
    _t = this;
    _mobMask.mask("+38 (099) 999-99-99", {
      completed: function() {
        return _t.$scope.$storage.strgData.phone = this.val();
      }
    });
    _nameMask = new Inputmask("U{1,64} (U{1,64})|(U{1,64} U{1,64})", {
      greedy: false,
      showMaskOnHover: false,
      oncomplete: (function(_this) {
        return function(e) {
          return _this.$scope.$storage.strgData.name = e.target.value;
        };
      })(this)
    });
    _nameMask.mask($('input[name="fullname"]')[0]);
    this.$scope.main.loading = false;
    return $(this.$element).find(".ui.form").form({
      inline: true,
      on: "blur",
      fields: {
        fullname: {
          identifier: "fullname",
          rules: [
            {
              type: "regExp[/^([а-яёієыї\\-\\']+\\s[а-яёієыї\\-\\']+)?(\\s[а-яёієыї\\-\\']+)?$/i]",
              prompt: "Введены недопустимые символы"
            }, {
              type: "empty",
              prompt: "Укажите Имя и Фамилию"
            }
          ]
        },
        bday: {
          identifier: "bday",
          rules: [
            {
              type: "regExp[/^\\d{2}[\\.]\\d{2}[\\.]\\d{4}$/i]",
              prompt: "Неправильная дата рождения"
            }
          ]
        },
        phone: {
          identifier: "phone",
          rules: [
            {
              type: "regExp[/^\\+38\\s\\(0\\d{2}\\)\\s\\d{3}\\-\\d{2}\\-\\d{2}$/i]",
              prompt: "Неправильный номер телефона"
            }, {
              type: "empty",
              prompt: "Вы не указали номер телефона"
            }
          ]
        },
        aggree: {
          identifier: "aggree",
          rules: [
            {
              type: "checked",
              prompt: "Так мы не сможем обработать Ваш запрос"
            }
          ]
        }
      }
    });
  };

  return twoStepController;

})();

// Generated by CoffeeScript 1.12.5
var twoCardsStepController;

twoCardsStepController = (function() {
  function twoCardsStepController($http, $scope, $sce, $window, $element, $attrs) {
    this.$http = $http;
    this.$scope = $scope;
    this.$sce = $sce;
    this.$window = $window;
    this.$element = $element;
    this.$attrs = $attrs;
    this.card_hover = "";
    this.content = [];
    this.content.push({
      icon: "user",
      title: "Получите +15%",
      text: this.$sce.trustAsHtml("к вероятности одобрения кредита, заполнив фамилию, имя и отчество.")
    });
    this.content.push({
      icon: "smartphone-text",
      title: "Зачем давать номер телефона?",
      text: this.$sce.trustAsHtml("Для связи. Представитель банка позвонит вам, чтобы обсудить условия кредита.")
    });
    this.content.push({
      icon: "adult",
      title: "А возраст им зачем?",
      text: this.$sce.trustAsHtml("Перед выдачей денег ваш возраст проверят по паспорту. Если вам не исполнилось 18, то шансов получить кредит нет.")
    });
  }

  return twoCardsStepController;

})();

// Generated by CoffeeScript 1.12.5
var threeStepController;

threeStepController = (function() {
  function threeStepController($http, $scope, $rootScope, $sce, $location, $element, $sceDelegate, $filter, $timeout) {
    this.$http = $http;
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$sce = $sce;
    this.$location = $location;
    this.$element = $element;
    this.$sceDelegate = $sceDelegate;
    this.$filter = $filter;
    this.$timeout = $timeout;
    this.data = {
      cities: {},
      employments: {}
    };
    this.$scope.$watch((function(_this) {
      return function(newValue, oldValue, scope) {
        return _this.$scope.main.currentStep;
      };
    })(this), (function(_this) {
      return function(newValue, oldValue, scope) {
        _this.$iElement = $(_this.$element);
        newValue = parseInt(newValue);
        if (newValue === 3) {
          _this.data.employments = {};
          _this.data.cities = {};
          return _this.init("cities", function(responce) {
            if (responce && responce.result === 'success') {
              this.data.cities = responce.data;
            }
            return this.init("employments", function(responce) {
              if (responce && responce.result === 'success') {
                return this.data.employments = responce.data;
              }
            });
          });
        }
      };
    })(this));
    this.$scope.$watch((function(_this) {
      return function(newValue, oldValue, scope) {
        return _this.data;
      };
    })(this), (function(_this) {
      return function(newValue, oldValue, scope) {
        if (Object.size(_this.data.cities) && Object.size(_this.data.employments)) {
          return _this.update();
        }
      };
    })(this), true);
  }

  threeStepController.prototype.card_hover = function($event, card) {
    return this.$scope.cards_three.card_hover = $event.type === "mouseover" ? card : "";
  };

  threeStepController.prototype.prevStep = function() {
    this.$scope.main.loading = true;
    this.data.employments = {};
    this.data.cities = {};
    return this.$scope.main.$location.path('/s2');
  };

  threeStepController.prototype.nextStep = function() {
    var data, form;
    form = $(this.$element).find(".ui.form");
    form = form.data("module-form");
    if (form && form.is.valid()) {
      this.$scope.main.loading = true;
      data = {
        aims: this.$scope.$storage.strgData.aims,
        amount: this.$scope.$storage.strgData.amount,
        name: this.$scope.$storage.strgData.name,
        phone: this.$scope.$storage.strgData.phone,
        bday: this.$scope.$storage.strgData.bday,
        employment: this.$scope.$storage.strgData.employment,
        city: this.$scope.$storage.strgData.city,
        utime: (new Date()).getTime()
      };
      if (!this.$scope.$storage.strgData.noinn) {
        data.inn = this.$scope.$storage.strgData.inn;
      }
      if (this.$rootScope.settings.api.debug === true) {
        data.result = "" + false;
      }
      this.data.employments = {};
      this.data.cities = {};
      return this.post(data, (function(_this) {
        return function(resp) {
          _this.$location.path("/request");
          _this.$scope.main.statusReq = (resp != null ? resp.result : void 0) === "success" ? true : false;
          _this.$scope.$storage.$reset();
          if (!_this.$scope.$$phase) {
            return _this.$scope.$apply();
          }
        };
      })(this));
    } else if (form) {
      return form.validate.form();
    }
  };

  threeStepController.prototype.update = function() {
    var _checkbox_noinn, _cityMask, _dropdown_city, _dropdown_employment, _innMask;
    this.chngMsg("add");
    _dropdown_city = this.$iElement.find(".ui.dropdown.city").dropdown({
      selectOnKeydown: false,
      allowReselection: true,
      forceSelection: false,
      hideAdditions: false,
      allowAdditions: true,
      message: {
        addResult: '<b>{term}</b>',
        noResults: 'Ничего не найдено.'
      },
      onChange: (function(_this) {
        return function(value, text, $selectedItem) {
          _this.$scope.$storage.strgData.city = text;
          return _this.$scope.$storage.strgData.city_val = value;
        };
      })(this)
    });
    _dropdown_employment = this.$iElement.find(".ui.dropdown.employment").dropdown({
      onChange: (function(_this) {
        return function(value, text, $selectedItem) {
          return _this.$scope.$storage.strgData.employment = value;
        };
      })(this)
    });
    _checkbox_noinn = this.$iElement.find(".ui.checkbox.noinn").checkbox().first().checkbox({
      fireOnInit: true,
      onChecked: (function(_this) {
        return function() {
          _this.$scope.$storage.strgData.noinn = true;
          return _this.chngMsg("add");
        };
      })(this),
      onUnchecked: (function(_this) {
        return function() {
          _this.$scope.$storage.strgData.noinn = false;
          return _this.chngMsg("remove");
        };
      })(this)
    });
    if (this.$scope.$storage.strgData.city_val) {
      this.$timeout((function(_this) {
        return function() {
          return _dropdown_city.data("module-dropdown").set.selected(_this.$scope.$storage.strgData.city);
        };
      })(this));
    }
    if (this.$scope.$storage.strgData.employment) {
      this.$timeout((function(_this) {
        return function() {
          return _dropdown_employment.data("module-dropdown").set.selected(_this.$scope.$storage.strgData.employment);
        };
      })(this));
    }
    _cityMask = new Inputmask("U{1,128}", {
      greedy: false,
      showMaskOnHover: false,
      oncomplete: (function(_this) {
        return function(e) {
          return _this.$scope.$storage.strgData.city = e.target.value;
        };
      })(this)
    });
    _cityMask.mask($('input[name="city"], .ui.dropdown input.search')[0]);
    _innMask = new Inputmask("9999999999", {
      greedy: false,
      showMaskOnHover: false,
      oncomplete: (function(_this) {
        return function(e) {
          return _this.$scope.$storage.strgData.inn = e.target.value;
        };
      })(this)
    });
    _innMask.mask($('input[name="inn"]')[0]);
    $(this.$element).find(".ui.form").form({
      inline: true,
      on: "blur",
      fields: {
        employment: {
          identifier: "employment",
          rules: [
            {
              type: "empty",
              prompt: "Выберите трудоустройство"
            }
          ]
        },
        city: {
          identifier: "city",
          rules: [
            {
              type: "empty",
              prompt: "Введите ваш город"
            }
          ]
        }
      }
    });
    return this.$scope.main.loading = false;
  };

  threeStepController.prototype.chngMsg = function(comm) {
    var _checkbox, _form;
    _form = $(this.$element).find(".ui.form");
    _checkbox = this.$iElement.find(".ui.button.right");
    if (comm === "add") {
      _form.form("add rule", "inn", {
        rules: [
          {
            type: "integer[10...10]",
            prompt: "Неправильный ИНН"
          }
        ]
      });
      if (this.$rootScope.isMobile === false) {
        return _checkbox.popup({
          transition: "horizontal flip",
          position: 'right center',
          target: '#inn',
          content: 'Без ИНН шансы на получение кредита значительно уменьшаются. Часть банков не будет рассматривать заявку, если отправить её без ИНН.'
        });
      }
    } else {
      _form.form("remove fields", ["inn"]);
      _form.form("validate field", "inn");
      if (this.$rootScope.isMobile === false) {
        return _checkbox.popup("destroy");
      }
    }
  };

  threeStepController.prototype.init = function(type, fn) {
    var clbck, params, trustedUrl;
    this.fn = fn;
    if (type) {
      params = {
        data: type
      };
      trustedUrl = this.$sceDelegate.trustAs(this.$sce.RESOURCE_URL, "" + this.$rootScope.settings.api.url + this.$rootScope.settings.api.command.list);
      clbck = (function(_this) {
        return function(responce) {
          return typeof _this.fn === "function" ? _this.fn(responce.data) : void 0;
        };
      })(this);
      return this.$http.jsonp(trustedUrl, {
        params: params
      }).then(clbck, clbck);
    }
  };

  threeStepController.prototype.post = function(data, fn) {
    var clbck, trustedUrl;
    this.fn = fn;
    if (data) {
      trustedUrl = this.$sceDelegate.trustAs(this.$sce.RESOURCE_URL, "" + this.$rootScope.settings.api.url + this.$rootScope.settings.api.command.put);
      clbck = (function(_this) {
        return function(responce) {
          return typeof _this.fn === "function" ? _this.fn(responce.data) : void 0;
        };
      })(this);
      return this.$http.jsonp(trustedUrl, {
        params: data
      }).then(clbck, clbck);
    }
  };

  return threeStepController;

})();

// Generated by CoffeeScript 1.12.5
var threeCardsStepController;

threeCardsStepController = (function() {
  function threeCardsStepController($http, $scope, $sce, $window, $element, $attrs) {
    this.$http = $http;
    this.$scope = $scope;
    this.$sce = $sce;
    this.$window = $window;
    this.$element = $element;
    this.$attrs = $attrs;
    this.card_hover = "";
    this.content = [];
    this.content.push({
      icon: "marker-map",
      title: "Подберём банки в вашем городе",
      text: this.$sce.trustAsHtml("Мы предложим кредиты в банках, у которых есть отделения в вашем городе или в ближайшем райцентре, если вы живёте в посёлке или селе. Украинские банки не дают кредиты жителям зоны АТО и Крыма.")
    });
    this.content.push({
      icon: "code",
      title: "Для чего банку ваш ИНН",
      text: this.$sce.trustAsHtml("Finance.ua соблюдает Закон Украины “О защите персональных данных”. Кроме банков и кредитных компаний ваш ИНН никто не получит. Банку индивидуальный налоговый номер нужен для проверки клиента. С помощью ИНН банк может узнать кредитную историю заёмщика, или проверить выплаты в пенсионный фонд.")
    });
  }

  return threeCardsStepController;

})();

// Generated by CoffeeScript 1.12.5
angular.module('finance-directives', ['ngMask']).directive('firstStep', function() {
  return {
    restrict: 'E',
    templateUrl: 'template/form_step1.html',
    controller: ['$http', '$scope', '$rootScope', '$sce', '$location', '$element', '$sceDelegate', '$filter', '$timeout', firstStepController],
    controllerAs: 'form_first'
  };
}).directive('twoStep', function() {
  return {
    restrict: 'E',
    templateUrl: 'template/form_step2.html',
    controller: ['$http', '$scope', '$rootScope', '$sce', '$location', '$element', '$sceDelegate', '$filter', '$timeout', twoStepController],
    controllerAs: 'form_two'
  };
}).directive('threeStep', function() {
  return {
    restrict: 'E',
    templateUrl: 'template/form_step3.html',
    controller: ['$http', '$scope', '$rootScope', '$sce', '$location', '$element', '$sceDelegate', '$filter', '$timeout', threeStepController],
    controllerAs: 'form_three'
  };
}).directive('firstCardsStep', function() {
  return {
    restrict: 'E',
    templateUrl: 'template/cards_step1.html',
    controller: ['$http', '$scope', '$sce', '$window', '$element', '$attrs', firstCardsStepController],
    controllerAs: 'cards_first'
  };
}).directive('twoCardsStep', function() {
  return {
    restrict: 'E',
    templateUrl: 'template/cards_step2.html',
    controller: ['$http', '$scope', '$sce', '$window', '$element', '$attrs', twoCardsStepController],
    controllerAs: 'cards_two'
  };
}).directive('threeCardsStep', function() {
  return {
    restrict: 'E',
    templateUrl: 'template/cards_step3.html',
    controller: ['$http', '$scope', '$sce', '$window', '$element', '$attrs', threeCardsStepController],
    controllerAs: 'cards_three'
  };
});

// Generated by CoffeeScript 1.12.5
var financeClassAppController;

financeClassAppController = (function() {
  function financeClassAppController($rootScope, $scope, $localStorage, $location, $window, $timeout, $route, $http, $sceDelegate, $sce) {
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$location = $location;
    this.$window = $window;
    this.$timeout = $timeout;
    this.$route = $route;
    this.$http = $http;
    this.$sceDelegate = $sceDelegate;
    this.$sce = $sce;
    this.$scope.$storage = this.$storage = $localStorage.$default({
      strgData: {
        amount: 5000
      }
    });
    this.loading = true;
    this.statusReq = false;
    this.currentStep = 1;
    this.maxStep = 3;
    this.$scope.$on('$locationChangeStart', (function(_this) {
      return function(e, newUrl, oldUrl, newState, oldState) {
        var _currentNameStep, fNameStep, fNumStep, regNameStep, regNumStep;
        regNumStep = new RegExp(/\d$/);
        regNameStep = new RegExp(/\w+\d?$/);
        fNumStep = regNumStep.exec(_this.$location.path());
        fNameStep = regNameStep.exec(_this.$location.path());
        _this.currentStep = (fNumStep != null ? fNumStep.length : void 0) ? fNumStep[0] : 1;
        _currentNameStep = (fNameStep != null ? fNameStep.length : void 0) ? fNameStep[0] : null;
        if (_currentNameStep !== "request") {
          _this.sendEvent(_currentNameStep);
        }
        if (_currentNameStep === "request") {
          _this.currentStep = _currentNameStep;
        }
        if (_currentNameStep === "request") {
          _this.sendEvent(_this.statusReq ? _currentNameStep + ".success" : _currentNameStep + ".error");
        }
        if (!_this.$scope.$$phase) {
          _this.$scope.$apply();
        }
        return _this.$timeout(function() {
          var _im, _inp;
          if (parseInt(_this.currentStep) === 1) {
            _this.init();
            _inp = $('input[name="email"]');
            _im = new Inputmask("email", {
              showMaskOnHover: false,
              androidHack: true
            });
            if (_inp.length) {
              if (_this.$rootScope.isMobile) {
                _inp[0].type = "email";
                _inp[0].required = true;
              } else {
                _im.mask(_inp[0]);
              }
            }
            return _this.$scope.main.loading = false;
          } else if (_currentNameStep === "request") {
            _this.$scope.main.loading = false;
            return $("html, body").animate({
              scrollTop: 0
            }, 600);
          }
        });
      };
    })(this));
    $((function(_this) {
      return function() {
        return _this.init();
      };
    })(this));
  }

  financeClassAppController.prototype.sendSubscr = function($event) {
    var _inEmail, clbck, params, ref, ref1;
    _inEmail = $("input[name=email]");
    if (_inEmail.length) {
      _inEmail = _inEmail[0];
    }
    if (((ref = _inEmail.inputmask) != null ? ref.isValid() : void 0) && ((ref1 = _inEmail.inputmask) != null ? ref1.isComplete() : void 0) || ((typeof _inEmail.checkValidity === "function" ? _inEmail.checkValidity() : void 0) && _inEmail.type === "email")) {
      this.$scope.main.loading = true;
      if (!this.$scope.$$phase) {
        this.$scope.$apply();
      }
      params = {
        email: this.$scope.emailSubscr
      };
      clbck = (function(_this) {
        return function(responce) {
          _this.$scope.main.loading = false;
          _this.$scope.main.respMsg = _this.msgSubscr(responce.data);
          $(".ui.page.dimmer").dimmer("show");
          _this.$scope.emailSubscr = "";
          if (!_this.$scope.$$phase) {
            return _this.$scope.$apply();
          }
        };
      })(this);
      return this.$http.get(this.$rootScope.settings.apiSubscr.url, {
        params: params
      }).then(clbck, clbck);
    } else if ((typeof _inEmail.checkValidity === "function" ? _inEmail.checkValidity() : void 0) === false) {
      return typeof _inEmail.reportValidity === "function" ? _inEmail.reportValidity() : void 0;
    }
  };

  financeClassAppController.prototype.msgSubscr = function(msg) {
    switch (msg) {
      case "Some fields are missing.":
        return "Заполните поле E-mail.";
      case "Invalid email address.":
        return "Недействительный адрес электронной почты.";
      case "Invalid list ID.":
        return "Недействительный идентификатор подписки.";
      case "Already subscribed.":
        return "Вы уже подписаны.";
      case "You're subscribed!":
        return "Вы подписаны на наши новости!";
      default:
        return "Извините, не удалось подписаться. Пожалуйста, повторите попытку позже!";
    }
  };

  financeClassAppController.prototype.init = function() {
    $(".ui.clients .ui.images").slick({
      infinite: true,
      centerMode: true,
      autoplay: true,
      accessibility: false,
      prevArrow: '<button class="slick-prev button icon basic" aria-label="Previous" type="button"></button>',
      nextArrow: '<button class="slick-next button icon basic" aria-label="Next" type="button"></button>',
      slideTrack: '<div class="slick-track images"/>',
      speed: 400,
      slidesToShow: 4,
      slidesToScroll: 1,
      responsive: [
        {
          breakpoint: 1199,
          settings: {
            slidesToShow: 3,
            slidesToScroll: 1,
            arrows: false
          }
        }, {
          breakpoint: 1000,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 1,
            arrows: false
          }
        }, {
          breakpoint: 768,
          settings: {
            autoplay: false,
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: true
          }
        }
      ]
    });
    $(".ui.sidebar").sidebar("attach events", ".toc.item").sidebar("setting", "dimPage", true).sidebar("setting", "transition", "push").sidebar("setting", "useLegacy", true);
    $(".ui.accordion").accordion();
    return $(".main.container").visibility({
      once: false,
      onOffScreen: function(calculations) {
        var _btn;
        _btn = $(".menu .computer-only .ui.button");
        return _btn.transition('scale in');
      },
      onOnScreen: function(calculations) {
        var _btn;
        _btn = $(".menu .computer-only .ui.button");
        if (!_btn.hasClass("hidden")) {
          return _btn.transition('scale out');
        }
      }
    });
  };

  financeClassAppController.prototype.titleStep = function() {
    return "Шаг " + this.currentStep + " из " + this.maxStep;
  };

  financeClassAppController.prototype.scrollTo = function($event, id) {
    return $("html, body").animate({
      scrollTop: $(id).offset().top
    }, 600);
  };

  financeClassAppController.prototype.sendEvent = function(evnt) {
    evnt = Object.get(this.$rootScope.settings.events, evnt);
    return this.$window.dispatchEvent(evnt);
  };

  return financeClassAppController;

})();

// Generated by CoffeeScript 1.12.5
var financeApp;

financeApp = angular.module('financeApp', ['finance-directives', 'ngRoute', 'ngSanitize', 'ngStorage']);

financeApp.config([
  "$sceDelegateProvider", "$localStorageProvider", "$locationProvider", function($sceDelegateProvider, $localStorageProvider, $locationProvider) {
    var _d, loclTime, strgData, strgTime;
    $sceDelegateProvider.resourceUrlWhitelist(["self", "http://credits*.finance.ua/api/**"]);
    $locationProvider.html5Mode(true);
    $localStorageProvider.setKeyPrefix("financeStorage-");
    strgTime = $localStorageProvider.get("strgTime");
    strgData = $localStorageProvider.get("strgData");
    loclTime = new Date();
    if (strgTime) {
      _d = new Date(strgTime != null ? strgTime.time : void 0);
      if (loclTime.getTime() > _d.getTime()) {
        $localStorageProvider.remove("strgData");
        _d = loclTime.getDateAdd(loclTime, "day", 1).toISOString();
      }
    } else {
      _d = loclTime.getDateAdd(loclTime, "day", 1).toISOString();
      if (strgData) {
        $localStorageProvider.remove("strgData");
      }
    }
    return $localStorageProvider.set("strgTime", {
      time: _d
    });
  }
]);

financeApp.run([
  "$rootScope", "$http", "$location", function($rootScope, $http, $location) {
    var paramsEvent;
    $location.path("/s1");
    $http.defaults.headers.common["Accept"] = "application/json";
    $http.defaults.headers.common["Content-Type"] = "application/json; charset=UTF-8";
    $http.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
    $rootScope.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile/i.test(navigator.userAgent);
    paramsEvent = {
      detail: {
        time: new Date()
      },
      bubbles: true,
      cancelable: true
    };
    $rootScope.settings = {
      apiSubscr: {
        url: "/subscribe/"
      },
      api: {
        debug: true,
        url: "//credits.finance.ua/api/",
        command: {
          list: "list",
          put: "submit"
        }
      },
      events: {
        s1: new CustomEvent("eventWidgetStep1", paramsEvent),
        s2: new CustomEvent("eventWidgetStep2", paramsEvent),
        s3: new CustomEvent("eventWidgetStep3", paramsEvent),
        request: {
          success: new CustomEvent("eventWidgetSuccess", paramsEvent),
          error: new CustomEvent("eventWidgetError", paramsEvent)
        },
        transitionEvent: function() {
          var element, k, transition, transitions, v;
          element = document.createElement("element");
          transitions = {
            transition: "transitionend",
            OTransition: "oTransitionEnd",
            MozTransition: "transitionend",
            WebkitTransition: "webkitTransitionEnd"
          };
          for (k in transitions) {
            v = transitions[k];
            if (element.style[k] !== void 0) {
              return transition = v;
            }
          }
          return transition;
        }
      }
    };
    return $(document).ready(function() {
      return $("#page-preloader").addClass("loaded").on($rootScope.settings.events.transitionEvent(), function(e) {
        return $(e.currentTarget).remove();
      });
    });
  }
]);

financeApp.controller("financeAppController", ['$rootScope', '$scope', '$localStorage', '$location', '$window', '$timeout', '$route', '$http', '$sceDelegate', '$sce', financeClassAppController]);
