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

/*!
* jquery.inputmask.min.js
* http://github.com/RobinHerbots/jquery.inputmask
* Copyright (c) 2010 - 2015 Robin Herbots
* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
* Version: 3.1.62
*/
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):a(jQuery)}(function(a){function b(a){var b=document.createElement("input"),c="on"+a,d=c in b;return d||(b.setAttribute(c,"return;"),d="function"==typeof b[c]),b=null,d}function c(a){var b="text"==a||"tel"==a;if(!b){var c=document.createElement("input");c.setAttribute("type",a),b="text"===c.type,c=null}return b}function d(b,c,e){var f=e.aliases[b];return f?(f.alias&&d(f.alias,void 0,e),a.extend(!0,e,f),a.extend(!0,e,c),!0):!1}function e(b,c){function d(c){function d(a,b,c,d){this.matches=[],this.isGroup=a||!1,this.isOptional=b||!1,this.isQuantifier=c||!1,this.isAlternator=d||!1,this.quantifier={min:1,max:1}}function e(c,d,e){var f=b.definitions[d],g=0==c.matches.length;if(e=void 0!=e?e:c.matches.length,f&&!m){f.placeholder=a.isFunction(f.placeholder)?f.placeholder.call(this,b):f.placeholder;for(var h=f.prevalidator,i=h?h.length:0,j=1;j<f.cardinality;j++){var k=i>=j?h[j-1]:[],l=k.validator,n=k.cardinality;c.matches.splice(e++,0,{fn:l?"string"==typeof l?new RegExp(l):new function(){this.test=l}:new RegExp("."),cardinality:n?n:1,optionality:c.isOptional,newBlockMarker:g,casing:f.casing,def:f.definitionSymbol||d,placeholder:f.placeholder,mask:d})}c.matches.splice(e++,0,{fn:f.validator?"string"==typeof f.validator?new RegExp(f.validator):new function(){this.test=f.validator}:new RegExp("."),cardinality:f.cardinality,optionality:c.isOptional,newBlockMarker:g,casing:f.casing,def:f.definitionSymbol||d,placeholder:f.placeholder,mask:d})}else c.matches.splice(e++,0,{fn:null,cardinality:0,optionality:c.isOptional,newBlockMarker:g,casing:null,def:d,placeholder:void 0,mask:d}),m=!1}for(var f,g,h,i,j,k,l=/(?:[?*+]|\{[0-9\+\*]+(?:,[0-9\+\*]*)?\})\??|[^.?*+^${[]()|\\]+|./g,m=!1,n=new d,o=[],p=[];f=l.exec(c);)switch(g=f[0],g.charAt(0)){case b.optionalmarker.end:case b.groupmarker.end:if(h=o.pop(),o.length>0){if(i=o[o.length-1],i.matches.push(h),i.isAlternator){j=o.pop();for(var q=0;q<j.matches.length;q++)j.matches[q].isGroup=!1;o.length>0?(i=o[o.length-1],i.matches.push(j)):n.matches.push(j)}}else n.matches.push(h);break;case b.optionalmarker.start:o.push(new d(!1,!0));break;case b.groupmarker.start:o.push(new d(!0));break;case b.quantifiermarker.start:var r=new d(!1,!1,!0);g=g.replace(/[{}]/g,"");var s=g.split(","),t=isNaN(s[0])?s[0]:parseInt(s[0]),u=1==s.length?t:isNaN(s[1])?s[1]:parseInt(s[1]);if(("*"==u||"+"==u)&&(t="*"==u?0:1),r.quantifier={min:t,max:u},o.length>0){var v=o[o.length-1].matches;if(f=v.pop(),!f.isGroup){var w=new d(!0);w.matches.push(f),f=w}v.push(f),v.push(r)}else{if(f=n.matches.pop(),!f.isGroup){var w=new d(!0);w.matches.push(f),f=w}n.matches.push(f),n.matches.push(r)}break;case b.escapeChar:m=!0;break;case b.alternatormarker:o.length>0?(i=o[o.length-1],k=i.matches.pop()):k=n.matches.pop(),k.isAlternator?o.push(k):(j=new d(!1,!1,!1,!0),j.matches.push(k),o.push(j));break;default:if(o.length>0){if(i=o[o.length-1],i.matches.length>0&&!i.isAlternator&&(k=i.matches[i.matches.length-1],k.isGroup&&(k.isGroup=!1,e(k,b.groupmarker.start,0),e(k,b.groupmarker.end))),e(i,g),i.isAlternator){j=o.pop();for(var q=0;q<j.matches.length;q++)j.matches[q].isGroup=!1;o.length>0?(i=o[o.length-1],i.matches.push(j)):n.matches.push(j)}}else n.matches.length>0&&(k=n.matches[n.matches.length-1],k.isGroup&&(k.isGroup=!1,e(k,b.groupmarker.start,0),e(k,b.groupmarker.end))),e(n,g)}return n.matches.length>0&&(k=n.matches[n.matches.length-1],k.isGroup&&(k.isGroup=!1,e(k,b.groupmarker.start,0),e(k,b.groupmarker.end)),p.push(n)),p}function e(e,f){if(void 0==e||""==e)return void 0;if(1==e.length&&0==b.greedy&&0!=b.repeat&&(b.placeholder=""),b.repeat>0||"*"==b.repeat||"+"==b.repeat){var g="*"==b.repeat?0:"+"==b.repeat?1:b.repeat;e=b.groupmarker.start+e+b.groupmarker.end+b.quantifiermarker.start+g+","+b.repeat+b.quantifiermarker.end}var h;return void 0==a.inputmask.masksCache[e]||c===!0?(h={mask:e,maskToken:d(e),validPositions:{},_buffer:void 0,buffer:void 0,tests:{},metadata:f},c!==!0&&(a.inputmask.masksCache[e]=h)):h=a.extend(!0,{},a.inputmask.masksCache[e]),h}function f(a){if(a=a.toString(),b.numericInput){a=a.split("").reverse();for(var c=0;c<a.length;c++)a[c]==b.optionalmarker.start?a[c]=b.optionalmarker.end:a[c]==b.optionalmarker.end?a[c]=b.optionalmarker.start:a[c]==b.groupmarker.start?a[c]=b.groupmarker.end:a[c]==b.groupmarker.end&&(a[c]=b.groupmarker.start);a=a.join("")}return a}var g=void 0;if(a.isFunction(b.mask)&&(b.mask=b.mask.call(this,b)),a.isArray(b.mask)){if(b.mask.length>1){b.keepStatic=void 0==b.keepStatic?!0:b.keepStatic;var h="(";return a.each(b.mask,function(b,c){h.length>1&&(h+=")|("),h+=f(void 0==c.mask||a.isFunction(c.mask)?c:c.mask)}),h+=")",e(h,b.mask)}b.mask=b.mask.pop()}return b.mask&&(g=void 0==b.mask.mask||a.isFunction(b.mask.mask)?e(f(b.mask),b.mask):e(f(b.mask.mask),b.mask)),g}function f(d,e,f){function g(a,b,c){b=b||0;var d,e,f,g=[],h=0;do{if(a===!0&&l().validPositions[h]){var i=l().validPositions[h];e=i.match,d=i.locator.slice(),g.push(c===!0?i.input:G(h,e))}else f=q(h,d,h-1),e=f.match,d=f.locator.slice(),g.push(G(h,e));h++}while((void 0==da||da>h-1)&&null!=e.fn||null==e.fn&&""!=e.def||b>=h);return g.pop(),g}function l(){return e}function m(a){var b=l();b.buffer=void 0,b.tests={},a!==!0&&(b._buffer=void 0,b.validPositions={},b.p=0)}function n(a,b){var c=l(),d=-1,e=c.validPositions;void 0==a&&(a=-1);var f=d,g=d;for(var h in e){var i=parseInt(h);e[i]&&(b||null!=e[i].match.fn)&&(a>=i&&(f=i),i>=a&&(g=i))}return d=-1!=f&&a-f>1||a>g?f:g}function o(b,c,d){if(f.insertMode&&void 0!=l().validPositions[b]&&void 0==d){var e,g=a.extend(!0,{},l().validPositions),h=n();for(e=b;h>=e;e++)delete l().validPositions[e];l().validPositions[b]=c;var i,j=!0,k=l().validPositions;for(e=i=b;h>=e;e++){var m=g[e];if(void 0!=m)for(var o=i;o<B()&&(null==m.match.fn&&k[e]&&(k[e].match.optionalQuantifier===!0||k[e].match.optionality===!0)||null!=m.match.fn);){if(null==m.match.fn||!f.keepStatic&&k[e]&&(void 0!=k[e+1]&&t(e+1,k[e].locator.slice(),e).length>1||void 0!=k[e].alternation)?o++:o=C(i),s(o,m.match.def)){j=z(o,m.input,!0,!0)!==!1,i=o;break}j=null==m.match.fn}if(!j)break}if(!j)return l().validPositions=a.extend(!0,{},g),!1}else l().validPositions[b]=c;return!0}function p(a,b,c,d){var e,g=a;l().p=a,void 0!=l().validPositions[a]&&l().validPositions[a].input==f.radixPoint&&(b++,g++);for(e=g;b>e;e++)void 0!=l().validPositions[e]&&(c===!0||0!=f.canClearPosition(l(),e,n(),d,f))&&delete l().validPositions[e];for(m(!0),e=g+1;e<=n();){for(;void 0!=l().validPositions[g];)g++;var h=l().validPositions[g];g>e&&(e=g+1);var i=l().validPositions[e];void 0!=i&&void 0==h?(s(g,i.match.def)&&z(g,i.input,!0)!==!1&&(delete l().validPositions[e],e++),g++):e++}var j=n(),k=B();for(j>=a&&void 0!=l().validPositions[j]&&l().validPositions[j].input==f.radixPoint&&delete l().validPositions[j],e=j+1;k>=e;e++)l().validPositions[e]&&delete l().validPositions[e];m(!0)}function q(a,b,c){var d=l().validPositions[a];if(void 0==d)for(var e=t(a,b,c),g=n(),h=l().validPositions[g]||t(0,void 0,void 0)[0],i=void 0!=h.alternation?h.locator[h.alternation].toString().split(","):[],j=0;j<e.length&&(d=e[j],!(d.match&&(f.greedy&&d.match.optionalQuantifier!==!0||(d.match.optionality===!1||d.match.newBlockMarker===!1)&&d.match.optionalQuantifier!==!0)&&(void 0==h.alternation||void 0!=d.locator[h.alternation]&&y(d.locator[h.alternation].toString().split(","),i))));j++);return d}function r(a){return l().validPositions[a]?l().validPositions[a].match:t(a)[0].match}function s(a,b){for(var c=!1,d=t(a),e=0;e<d.length;e++)if(d[e].match&&d[e].match.def==b){c=!0;break}return c}function t(b,c,d,e){function f(c,d,e,g){function i(e,g,n){if(h>1e4)return alert("jquery.inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. "+l().mask),!0;if(h==b&&void 0==e.matches)return j.push({match:e,locator:g.reverse()}),!0;if(void 0!=e.matches){if(e.isGroup&&n!==!0){if(e=i(c.matches[m+1],g))return!0}else if(e.isOptional){var o=e;if(e=f(e,d,g,n)){var p=j[j.length-1].match,q=0==a.inArray(p,o.matches);if(!q)return!0;k=!0,h=b}}else if(e.isAlternator){var r,s=e,t=[],u=j.slice(),v=g.length,w=d.length>0?d.shift():-1;if(-1==w||"string"==typeof w){var x,y=h,z=d.slice();"string"==typeof w&&(x=w.split(","));for(var A=0;A<s.matches.length;A++){j=[],e=i(s.matches[A],[A].concat(g),n)||e,r=j.slice(),h=y,j=[];for(var B=0;B<z.length;B++)d[B]=z[B];for(var C=0;C<r.length;C++){var D=r[C];D.alternation=v;for(var E=0;E<t.length;E++){var F=t[E];if(D.match.mask==F.match.mask&&("string"!=typeof w||-1!=a.inArray(D.locator[v].toString(),x))){r.splice(C,1),F.locator[v]=F.locator[v]+","+D.locator[v],F.alternation=v;break}}}t=t.concat(r)}"string"==typeof w&&(t=a.map(t,function(b,c){if(isFinite(c)){var d,e=b.locator[v].toString().split(",");b.locator[v]=void 0,b.alternation=void 0;for(var f=0;f<e.length;f++)d=-1!=a.inArray(e[f],x),d&&(void 0!=b.locator[v]?(b.locator[v]+=",",b.locator[v]+=e[f]):b.locator[v]=parseInt(e[f]),b.alternation=v);if(void 0!=b.locator[v])return b}})),j=u.concat(t),h=b,k=!0}else e=i(s.matches[w],[w].concat(g),n);if(e)return!0}else if(e.isQuantifier&&n!==!0)for(var G=e,H=d.length>0&&n!==!0?d.shift():0;H<(isNaN(G.quantifier.max)?H+1:G.quantifier.max)&&b>=h;H++){var I=c.matches[a.inArray(G,c.matches)-1];if(e=i(I,[H].concat(g),!0)){var p=j[j.length-1].match;p.optionalQuantifier=H>G.quantifier.min-1;var q=0==a.inArray(p,I.matches);if(q){if(H>G.quantifier.min-1){k=!0,h=b;break}return!0}return!0}}else if(e=f(e,d,g,n))return!0}else h++}for(var m=d.length>0?d.shift():0;m<c.matches.length;m++)if(c.matches[m].isQuantifier!==!0){var n=i(c.matches[m],[m].concat(e),g);if(n&&h==b)return n;if(h>b)break}}var g=l().maskToken,h=c?d:0,i=c||[0],j=[],k=!1;if(void 0==c){for(var m,n=b-1;void 0==(m=l().validPositions[n])&&n>-1;)n--;if(void 0!=m&&n>-1)h=n,i=m.locator.slice();else{for(n=b-1;void 0==(m=l().tests[n])&&n>-1;)n--;void 0!=m&&n>-1&&(h=n,i=m[0].locator.slice())}}for(var o=i.shift();o<g.length;o++){var p=f(g[o],i,[o]);if(p&&h==b||h>b)break}return(0==j.length||k)&&j.push({match:{fn:null,cardinality:0,optionality:!0,casing:null,def:""},locator:[]}),l().tests[b]=a.extend(!0,[],j),l().tests[b]}function u(){return void 0==l()._buffer&&(l()._buffer=g(!1,1)),l()._buffer}function v(){return void 0==l().buffer&&(l().buffer=g(!0,n(),!0)),l().buffer}function w(a,b,c){if(c=c||v().slice(),a===!0)m(),a=0,b=c.length;else for(var d=a;b>d;d++)delete l().validPositions[d],delete l().tests[d];for(var d=a;b>d;d++)c[d]!=f.skipOptionalPartCharacter&&z(d,c[d],!0,!0)}function x(a,b){switch(b.casing){case"upper":a=a.toUpperCase();break;case"lower":a=a.toLowerCase()}return a}function y(b,c){for(var d=f.greedy?c:c.slice(0,1),e=!1,g=0;g<b.length;g++)if(-1!=a.inArray(b[g],d)){e=!0;break}return e}function z(b,c,d,e){function g(b,c,d,e){var g=!1;return a.each(t(b),function(h,i){for(var j=i.match,k=c?1:0,q="",r=(v(),j.cardinality);r>k;r--)q+=E(b-(r-1));if(c&&(q+=c),g=null!=j.fn?j.fn.test(q,l(),b,d,f):c!=j.def&&c!=f.skipOptionalPartCharacter||""==j.def?!1:{c:j.def,pos:b},g!==!1){var s=void 0!=g.c?g.c:c;s=s==f.skipOptionalPartCharacter&&null===j.fn?j.def:s;var t=b,u=v();if(void 0!=g.remove&&(a.isArray(g.remove)||(g.remove=[g.remove]),a.each(g.remove.sort(function(a,b){return b-a}),function(a,b){p(b,b+1,!0)})),void 0!=g.insert&&(a.isArray(g.insert)||(g.insert=[g.insert]),a.each(g.insert.sort(function(a,b){return a-b}),function(a,b){z(b.pos,b.c,!0)})),g.refreshFromBuffer){var y=g.refreshFromBuffer;if(d=!0,w(y===!0?y:y.start,y.end,u),void 0==g.pos&&void 0==g.c)return g.pos=n(),!1;if(t=void 0!=g.pos?g.pos:b,t!=b)return g=a.extend(g,z(t,s,!0)),!1}else if(g!==!0&&void 0!=g.pos&&g.pos!=b&&(t=g.pos,w(b,t),t!=b))return g=a.extend(g,z(t,s,!0)),!1;return 1!=g&&void 0==g.pos&&void 0==g.c?!1:(h>0&&m(!0),o(t,a.extend({},i,{input:x(s,j)}),e)||(g=!1),!1)}}),g}function h(b,c,d,e){var g,h,i,j,k=a.extend(!0,{},l().validPositions);for(g=n();g>=0;g--)if(j=l().validPositions[g],j&&void 0!=j.alternation&&j.locator[j.alternation].length>1){h=l().validPositions[g].alternation;break}if(void 0!=h)for(var o in l().validPositions)if(j=l().validPositions[o],parseInt(o)>parseInt(g)&&j.alternation){for(var p=j.locator[h],q=l().validPositions[g].locator[h].toString().split(","),r=0;r<q.length;r++)if(p<q[r]){for(var s,t,u=o-1;u>=0;u--)if(s=l().validPositions[u],void 0!=s){t=s.locator[h],s.locator[h]=parseInt(q[r]);break}if(p!=s.locator[h]){for(var v=[],w=o;w<n()+1;w++){var x=l().validPositions[w];x&&null!=x.match.fn&&v.push(x.input),delete l().validPositions[w],delete l().tests[w]}for(m(!0),f.keepStatic=!f.keepStatic,i=!0;v.length>0;){var y=v.shift();if(y!=f.skipOptionalPartCharacter&&!(i=z(n()+1,y,!1,!0)))break}if(s.alternation=h,s.locator[h]=t,i&&(i=z(b,c,d,e)),f.keepStatic=!f.keepStatic,i)return i;m(),l().validPositions=a.extend(!0,{},k)}}break}return!1}function i(b,c){for(var d=l().validPositions[c],e=d.locator,f=e.length,g=b;c>g;g++)if(!A(g)){var h=t(g),i=h[0],j=-1;a.each(h,function(a,b){for(var c=0;f>c;c++)b.locator[c]&&y(b.locator[c].toString().split(","),e[c].toString().split(","))&&c>j&&(j=c,i=b)}),o(g,a.extend({},i,{input:i.match.def}),!0)}}d=d===!0;for(var j=v(),k=b-1;k>-1&&!l().validPositions[k];k--);for(k++;b>k;k++)void 0==l().validPositions[k]&&((!A(k)||j[k]!=G(k))&&t(k).length>1||j[k]==f.radixPoint||"0"==j[k]&&a.inArray(f.radixPoint,j)<k)&&g(k,j[k],!0);var q=b,r=!1,s=a.extend(!0,{},l().validPositions);if(q<B()&&(r=g(q,c,d,e),(!d||e)&&r===!1)){var u=l().validPositions[q];if(!u||null!=u.match.fn||u.match.def!=c&&c!=f.skipOptionalPartCharacter){if((f.insertMode||void 0==l().validPositions[C(q)])&&!A(q))for(var D=q+1,F=C(q);F>=D;D++)if(r=g(D,c,d,e),r!==!1){i(q,D),q=D;break}}else r={caret:C(q)}}if(r===!1&&f.keepStatic&&O(j)&&(r=h(b,c,d,e)),r===!0&&(r={pos:q}),a.isFunction(f.postValidation)&&0!=r&&!d){m(!0);var H=f.postValidation(v(),f);if(!H)return m(!0),l().validPositions=a.extend(!0,{},s),!1}return r}function A(a){var b=r(a);if(null!=b.fn)return b.fn;if(!f.keepStatic&&void 0==l().validPositions[a]){for(var c=t(a),d=!0,e=0;e<c.length;e++)if(""!=c[e].match.def&&(null!==c[e].match.fn||void 0==c[e].alternation||c[e].locator[c[e].alternation].length>1)){d=!1;break}return d}return!1}function B(){var a;da=ca.prop("maxLength"),-1==da&&(da=void 0);var b,c=n(),d=l().validPositions[c],e=void 0!=d?d.locator.slice():void 0;for(b=c+1;void 0==d||null!=d.match.fn||null==d.match.fn&&""!=d.match.def;b++)d=q(b,e,b-1),e=d.locator.slice();var f=r(b-1);return a=""!=f.def?b:b-1,void 0==da||da>a?a:da}function C(a){var b=B();if(a>=b)return b;for(var c=a;++c<b&&!A(c)&&(f.nojumps!==!0||f.nojumpsThreshold>c););return c}function D(a){var b=a;if(0>=b)return 0;for(;--b>0&&!A(b););return b}function E(a){return void 0==l().validPositions[a]?G(a):l().validPositions[a].input}function F(b,c,d,e,g){if(e&&a.isFunction(f.onBeforeWrite)){var h=f.onBeforeWrite.call(b,e,c,d,f);if(h){if(h.refreshFromBuffer){var i=h.refreshFromBuffer;w(i===!0?i:i.start,i.end,h.buffer),m(!0),c=v()}d=h.caret||d}}b._valueSet(c.join("")),void 0!=d&&L(b,d),g===!0&&(ga=!0,a(b).trigger("input"))}function G(a,b){if(b=b||r(a),void 0!=b.placeholder)return b.placeholder;if(null==b.fn){if(!f.keepStatic&&void 0==l().validPositions[a]){for(var c=t(a),d=!0,e=0;e<c.length;e++)if(""!=c[e].match.def&&(null!==c[e].match.fn||void 0==c[e].alternation||c[e].locator[c[e].alternation].length>1)){d=!1;break}if(d)return f.placeholder.charAt(a%f.placeholder.length)}return b.def}return f.placeholder.charAt(a%f.placeholder.length)}function H(b,c,d,e){function f(){var a=!1,b=u().slice(i,C(i)).join("").indexOf(h);if(-1!=b&&!A(i)){a=!0;for(var c=u().slice(i,i+b),d=0;d<c.length;d++)if(" "!=c[d]){a=!1;break}}return a}var g=void 0!=e?e.slice():b._valueGet().split(""),h="",i=0;if(m(),l().p=C(-1),c&&b._valueSet(""),!d){var j=u().slice(0,C(-1)).join(""),k=g.join("").match(new RegExp(I(j),"g"));k&&k.length>0&&(g.splice(0,k.length*j.length),i=C(i))}a.each(g,function(c,e){var g=a.Event("keypress");g.which=e.charCodeAt(0),h+=e;var j=n(void 0,!0),k=l().validPositions[j],m=q(j+1,k?k.locator.slice():void 0,j);if(!f()||d){var o=d?c:null==m.match.fn&&m.match.optionality&&j+1<l().p?j+1:l().p;U.call(b,g,!0,!1,d,o),i=o+1,h=""}else U.call(b,g,!0,!1,!0,j+1)}),c&&F(b,v(),a(b).is(":focus")?C(n(0)):void 0,a.Event("checkval"))}function I(b){return a.inputmask.escapeRegex(b)}function J(b){if(b.data("_inputmask")&&!b.hasClass("hasDatepicker")){var c=[],d=l().validPositions;for(var e in d)d[e].match&&null!=d[e].match.fn&&c.push(d[e].input);var g=(ea?c.reverse():c).join(""),h=(ea?v().slice().reverse():v()).join("");return a.isFunction(f.onUnMask)&&(g=f.onUnMask.call(b,h,g,f)||g),g}return b[0]._valueGet()}function K(a){if(ea&&"number"==typeof a&&(!f.greedy||""!=f.placeholder)){var b=v().length;a=b-a}return a}function L(b,c,d){var e,g=b.jquery&&b.length>0?b[0]:b;if("number"!=typeof c)return g.setSelectionRange?(c=g.selectionStart,d=g.selectionEnd):window.getSelection?(e=window.getSelection().getRangeAt(0),e.commonAncestorContainer.parentNode==g&&(c=e.startOffset,d=e.endOffset)):document.selection&&document.selection.createRange&&(e=document.selection.createRange(),c=0-e.duplicate().moveStart("character",-1e5),d=c+e.text.length),{begin:K(c),end:K(d)};if(c=K(c),d=K(d),d="number"==typeof d?d:c,a(g).is(":visible")){var h=a(g).css("font-size").replace("px","")*d;if(g.scrollLeft=h>g.scrollWidth?h:0,i||0!=f.insertMode||c!=d||d++,g.setSelectionRange)g.selectionStart=c,g.selectionEnd=d;else if(window.getSelection){e=document.createRange(),e.setStart(g.firstChild,c<g._valueGet().length?c:g._valueGet().length),e.setEnd(g.firstChild,d<g._valueGet().length?d:g._valueGet().length),e.collapse(!0);var j=window.getSelection();j.removeAllRanges(),j.addRange(e)}else g.createTextRange&&(e=g.createTextRange(),e.collapse(!0),e.moveEnd("character",d),e.moveStart("character",c),e.select())}}function M(b){var c,d,e=v(),f=e.length,g=n(),h={},i=l().validPositions[g],j=void 0!=i?i.locator.slice():void 0;for(c=g+1;c<e.length;c++)d=q(c,j,c-1),j=d.locator.slice(),h[c]=a.extend(!0,{},d);var k=i&&void 0!=i.alternation?i.locator[i.alternation]:void 0;for(c=f-1;c>g&&(d=h[c].match,(d.optionality||d.optionalQuantifier||k&&k!=h[c].locator[i.alternation])&&e[c]==G(c,d));c--)f--;return b?{l:f,def:h[f]?h[f].match:void 0}:f}function N(a){for(var b=M(),c=a.length-1;c>b&&!A(c);c--);return a.splice(b,c+1-b),a}function O(b){if(a.isFunction(f.isComplete))return f.isComplete.call(ca,b,f);if("*"==f.repeat)return void 0;{var c=!1,d=M(!0),e=D(d.l);n()}if(void 0==d.def||d.def.newBlockMarker||d.def.optionality||d.def.optionalQuantifier){c=!0;for(var g=0;e>=g;g++){var h=A(g),i=r(g);if(h&&void 0==l().validPositions[g]&&i.optionality!==!0&&i.optionalQuantifier!==!0||!h&&b[g]!=G(g)){c=!1;break}}}return c}function P(a,b){return ea?a-b>1||a-b==1&&f.insertMode:b-a>1||b-a==1&&f.insertMode}function Q(b){var c=a._data(b).events,d=!1;a.each(c,function(b,c){a.each(c,function(a,b){if("inputmask"==b.namespace&&"setvalue"!=b.type){var c=b.handler;b.handler=function(a){if(!this.disabled&&(!this.readOnly||"keydown"==a.type&&a.ctrlKey&&67==a.keyCode)){switch(a.type){case"input":if(ga===!0||d===!0)return ga=!1,a.preventDefault();break;case"keydown":fa=!1,d=!1;break;case"keypress":if(fa===!0)return a.preventDefault();fa=!0;break;case"compositionstart":d=!0;break;case"compositionupdate":ga=!0;break;case"compositionend":d=!1}return c.apply(this,arguments)}a.preventDefault()}}})})}function R(b){function c(b){if(void 0==a.valHooks[b]||1!=a.valHooks[b].inputmaskpatch){var c=a.valHooks[b]&&a.valHooks[b].get?a.valHooks[b].get:function(a){return a.value},d=a.valHooks[b]&&a.valHooks[b].set?a.valHooks[b].set:function(a,b){return a.value=b,a};a.valHooks[b]={get:function(b){var d=a(b);if(d.data("_inputmask")){if(d.data("_inputmask").opts.autoUnmask)return d.inputmask("unmaskedvalue");var e=c(b),f=d.data("_inputmask"),g=f.maskset,h=g._buffer;return h=h?h.join(""):"",e!=h?e:""}return c(b)},set:function(b,c){var e,f=a(b),g=f.data("_inputmask");return e=d(b,c),g&&f.triggerHandler("setvalue.inputmask"),e},inputmaskpatch:!0}}}function d(){var b=a(this),c=a(this).data("_inputmask");return c?c.opts.autoUnmask?b.inputmask("unmaskedvalue"):g.call(this)!=u().join("")?g.call(this):"":g.call(this)}function e(b){var c=a(this).data("_inputmask");h.call(this,b),c&&a(this).triggerHandler("setvalue.inputmask")}function f(b){a(b).bind("mouseenter.inputmask",function(){var b=a(this),c=this,d=c._valueGet();""!=d&&d!=v().join("")&&b.triggerHandler("setvalue.inputmask")});
//!! the bound handlers are executed in the order they where bound
var c=a._data(b).events,d=c.mouseover;if(d){for(var e=d[d.length-1],f=d.length-1;f>0;f--)d[f]=d[f-1];d[0]=e}}var g,h;if(!b._valueGet){var i;Object.getOwnPropertyDescriptor&&void 0==b.value?(g=function(){return this.textContent},h=function(a){this.textContent=a},Object.defineProperty(b,"value",{get:d,set:e})):((i=Object.getOwnPropertyDescriptor&&Object.getOwnPropertyDescriptor(b,"value"))&&i.configurable,document.__lookupGetter__&&b.__lookupGetter__("value")?(g=b.__lookupGetter__("value"),h=b.__lookupSetter__("value"),b.__defineGetter__("value",d),b.__defineSetter__("value",e)):(g=function(){return b.value},h=function(a){b.value=a},c(b.type),f(b))),b._valueGet=function(a){return ea&&a!==!0?g.call(this).split("").reverse().join(""):g.call(this)},b._valueSet=function(a){h.call(this,ea?a.split("").reverse().join(""):a)}}}function S(b,c,d,e){function g(){if(f.keepStatic){m(!0);var c,d=[],e=a.extend(!0,{},l().validPositions);for(c=n();c>=0;c--){var g=l().validPositions[c];if(g){if(void 0!=g.alternation&&g.locator[g.alternation]==q(c).locator[g.alternation])break;null!=g.match.fn&&d.push(g.input),delete l().validPositions[c]}}if(c>0)for(;d.length>0;){l().p=C(n());var h=a.Event("keypress");h.which=d.pop().charCodeAt(0),U.call(b,h,!0,!1,!1,l().p)}else l().validPositions=a.extend(!0,{},e)}}if((f.numericInput||ea)&&(c==a.inputmask.keyCode.BACKSPACE?c=a.inputmask.keyCode.DELETE:c==a.inputmask.keyCode.DELETE&&(c=a.inputmask.keyCode.BACKSPACE),ea)){var h=d.end;d.end=d.begin,d.begin=h}if(c==a.inputmask.keyCode.BACKSPACE&&(d.end-d.begin<1||0==f.insertMode)?d.begin=D(d.begin):c==a.inputmask.keyCode.DELETE&&d.begin==d.end&&(d.end=A(d.end)?d.end+1:C(d.end)+1),p(d.begin,d.end,!1,e),e!==!0){g();var i=n(d.begin);i<d.begin?(-1==i&&m(),l().p=C(i)):l().p=d.begin}}function T(c){var d=this,e=a(d),g=c.keyCode,i=L(d);g==a.inputmask.keyCode.BACKSPACE||g==a.inputmask.keyCode.DELETE||h&&127==g||c.ctrlKey&&88==g&&!b("cut")?(c.preventDefault(),88==g&&(_=v().join("")),S(d,g,i),F(d,v(),l().p,c,_!=v().join("")),d._valueGet()==u().join("")?e.trigger("cleared"):O(v())===!0&&e.trigger("complete"),f.showTooltip&&e.prop("title",l().mask)):g==a.inputmask.keyCode.END||g==a.inputmask.keyCode.PAGE_DOWN?setTimeout(function(){var a=C(n());f.insertMode||a!=B()||c.shiftKey||a--,L(d,c.shiftKey?i.begin:a,a)},0):g==a.inputmask.keyCode.HOME&&!c.shiftKey||g==a.inputmask.keyCode.PAGE_UP?L(d,0,c.shiftKey?i.begin:0):(f.undoOnEscape&&g==a.inputmask.keyCode.ESCAPE||90==g&&c.ctrlKey)&&c.altKey!==!0?(H(d,!0,!1,_.split("")),e.click()):g!=a.inputmask.keyCode.INSERT||c.shiftKey||c.ctrlKey?0!=f.insertMode||c.shiftKey||(g==a.inputmask.keyCode.RIGHT?setTimeout(function(){var a=L(d);L(d,a.begin)},0):g==a.inputmask.keyCode.LEFT&&setTimeout(function(){var a=L(d);L(d,ea?a.begin+1:a.begin-1)},0)):(f.insertMode=!f.insertMode,L(d,f.insertMode||i.begin!=B()?i.begin:i.begin-1)),f.onKeyDown.call(this,c,v(),L(d).begin,f),ha=-1!=a.inArray(g,f.ignorables)}function U(b,c,d,e,g){var h=this,i=a(h),j=b.which||b.charCode||b.keyCode;if(!(c===!0||b.ctrlKey&&b.altKey)&&(b.ctrlKey||b.metaKey||ha))return!0;if(j){46==j&&0==b.shiftKey&&","==f.radixPoint&&(j=44);var k,n=c?{begin:g,end:g}:L(h),p=String.fromCharCode(j),q=P(n.begin,n.end);q&&(l().undoPositions=a.extend(!0,{},l().validPositions),S(h,a.inputmask.keyCode.DELETE,n,!0),n.begin=l().p,f.insertMode||(f.insertMode=!f.insertMode,o(n.begin,e),f.insertMode=!f.insertMode),q=!f.multi),l().writeOutBuffer=!0;var r=ea&&!q?n.end:n.begin,s=z(r,p,e);if(s!==!1){if(s!==!0&&(r=void 0!=s.pos?s.pos:r,p=void 0!=s.c?s.c:p),m(!0),void 0!=s.caret)k=s.caret;else{var u=l().validPositions;k=!f.keepStatic&&(void 0!=u[r+1]&&t(r+1,u[r].locator.slice(),r).length>1||void 0!=u[r].alternation)?r+1:C(r)}l().p=k}if(d!==!1){var x=this;if(setTimeout(function(){f.onKeyValidation.call(x,s,f)},0),l().writeOutBuffer&&s!==!1){var y=v();F(h,y,c?void 0:f.numericInput?D(k):k,b,c!==!0),c!==!0&&setTimeout(function(){O(y)===!0&&i.trigger("complete")},0)}else q&&(l().buffer=void 0,l().validPositions=l().undoPositions)}else q&&(l().buffer=void 0,l().validPositions=l().undoPositions);if(f.showTooltip&&i.prop("title",l().mask),c&&a.isFunction(f.onBeforeWrite)){var A=f.onBeforeWrite.call(this,b,v(),k,f);if(A&&A.refreshFromBuffer){var B=A.refreshFromBuffer;w(B===!0?B:B.start,B.end,A.buffer),m(!0),A.caret&&(l().p=A.caret)}}b.preventDefault()}}function V(b){var c=this,d=a(c),e=c._valueGet(!0),g=L(c);if("propertychange"==b.type&&c._valueGet().length<=B())return!0;if("paste"==b.type){var h=e.substr(0,g.begin),i=e.substr(g.end,e.length);h==u().slice(0,g.begin).join("")&&(h=""),i==u().slice(g.end).join("")&&(i=""),window.clipboardData&&window.clipboardData.getData?e=h+window.clipboardData.getData("Text")+i:b.originalEvent&&b.originalEvent.clipboardData&&b.originalEvent.clipboardData.getData&&(e=h+b.originalEvent.clipboardData.getData("text/plain")+i)}var j=e;if(a.isFunction(f.onBeforePaste)){if(j=f.onBeforePaste.call(c,e,f),j===!1)return b.preventDefault(),!1;j||(j=e)}return H(c,!0,!1,ea?j.split("").reverse():j.split("")),d.click(),O(v())===!0&&d.trigger("complete"),!1}function W(b){var c=this;H(c,!0,!1),O(v())===!0&&a(c).trigger("complete"),b.preventDefault()}function X(a){var b=this;_=v().join(""),(""==ba||0!=a.originalEvent.data.indexOf(ba))&&(aa=L(b))}function Y(b){var c=this,d=aa||L(c);0==b.originalEvent.data.indexOf(ba)&&(m(),d={begin:0,end:0});var e=b.originalEvent.data;L(c,d.begin,d.end);for(var g=0;g<e.length;g++){var h=a.Event("keypress");h.which=e.charCodeAt(g),fa=!1,ha=!1,U.call(c,h)}setTimeout(function(){var a=l().p;F(c,v(),f.numericInput?D(a):a)},0),ba=b.originalEvent.data}function Z(){}function $(b){if(ca=a(b),ca.is(":input")&&c(ca.attr("type"))||b.isContentEditable||ca.is("div")){if(ca.data("_inputmask",{maskset:e,opts:f,isRTL:!1}),f.showTooltip&&ca.prop("title",l().mask),("rtl"==b.dir||f.rightAlign)&&ca.css("text-align","right"),"rtl"==b.dir||f.numericInput){b.dir="ltr",ca.removeAttr("dir");var d=ca.data("_inputmask");d.isRTL=!0,ca.data("_inputmask",d),ea=!0}ca.unbind(".inputmask"),(ca.is(":input")||b.isContentEditable)&&(ca.closest("form").bind("submit",function(){_!=v().join("")&&ca.change(),ca[0]._valueGet&&ca[0]._valueGet()==u().join("")&&ca[0]._valueSet(""),f.removeMaskOnSubmit&&ca.inputmask("remove")}).bind("reset",function(){setTimeout(function(){ca.triggerHandler("setvalue.inputmask")},0)}),ca.bind("mouseenter.inputmask",function(){var b=a(this),c=this;!b.is(":focus")&&f.showMaskOnHover&&c._valueGet()!=v().join("")&&F(c,v())}).bind("blur.inputmask",function(b){var c=a(this),d=this;if(c.data("_inputmask")){var e=d._valueGet(),g=v().slice();ia=!0,_!=g.join("")&&setTimeout(function(){c.change(),_=g.join("")},0),""!=e&&(f.clearMaskOnLostFocus&&(e==u().join("")?g=[]:N(g)),O(g)===!1&&(c.trigger("incomplete"),f.clearIncomplete&&(m(),g=f.clearMaskOnLostFocus?[]:u().slice())),F(d,g,void 0,b))}}).bind("focus.inputmask",function(){var b=(a(this),this),c=b._valueGet();f.showMaskOnFocus&&(!f.showMaskOnHover||f.showMaskOnHover&&""==c)&&b._valueGet()!=v().join("")&&F(b,v(),C(n())),_=v().join("")}).bind("mouseleave.inputmask",function(){var b=a(this),c=this;if(f.clearMaskOnLostFocus){var d=v().slice(),e=c._valueGet();b.is(":focus")||e==b.attr("placeholder")||""==e||(e==u().join("")?d=[]:N(d),F(c,d))}}).bind("click.inputmask",function(){var b=a(this),c=this;if(b.is(":focus")){var d=L(c);if(d.begin==d.end)if(f.radixFocus&&""!=f.radixPoint&&-1!=a.inArray(f.radixPoint,v())&&(ia||v().join("")==u().join("")))L(c,a.inArray(f.radixPoint,v())),ia=!1;else{var e=ea?K(d.begin):d.begin,g=C(n(e));g>e?L(c,A(e)?e:C(e)):L(c,g)}}}).bind("dblclick.inputmask",function(){var a=this;setTimeout(function(){L(a,0,C(n()))},0)}).bind(k+".inputmask dragdrop.inputmask drop.inputmask",V).bind("cut.inputmask",function(b){ga=!0;var c=this,d=a(c),e=L(c);S(c,a.inputmask.keyCode.DELETE,e),F(c,v(),l().p,b,_!=v().join("")),c._valueGet()==u().join("")&&d.trigger("cleared"),f.showTooltip&&d.prop("title",l().mask)}).bind("complete.inputmask",f.oncomplete).bind("incomplete.inputmask",f.onincomplete).bind("cleared.inputmask",f.oncleared),ca.bind("keydown.inputmask",T).bind("keypress.inputmask",U),j||ca.bind("compositionstart.inputmask",X).bind("compositionupdate.inputmask",Y).bind("compositionend.inputmask",Z),"paste"===k&&ca.bind("input.inputmask",W)),ca.bind("setvalue.inputmask",function(){var b=this,c=b._valueGet();b._valueSet(a.isFunction(f.onBeforeMask)?f.onBeforeMask.call(b,c,f)||c:c),H(b,!0,!1),_=v().join(""),(f.clearMaskOnLostFocus||f.clearIncomplete)&&b._valueGet()==u().join("")&&b._valueSet("")}),R(b);var g=a.isFunction(f.onBeforeMask)?f.onBeforeMask.call(b,b._valueGet(),f)||b._valueGet():b._valueGet();H(b,!0,!1,g.split(""));var h=v().slice();_=h.join("");var i;try{i=document.activeElement}catch(o){}O(h)===!1&&f.clearIncomplete&&m(),f.clearMaskOnLostFocus&&(h.join("")==u().join("")?h=[]:N(h)),F(b,h),i===b&&L(b,C(n())),Q(b)}}var _,aa,ba,ca,da,ea=!1,fa=!1,ga=!1,ha=!1,ia=!0;if(void 0!=d)switch(d.action){case"isComplete":return ca=a(d.el),e=ca.data("_inputmask").maskset,f=ca.data("_inputmask").opts,O(d.buffer);case"unmaskedvalue":return ca=d.$input,e=ca.data("_inputmask").maskset,f=ca.data("_inputmask").opts,ea=d.$input.data("_inputmask").isRTL,J(d.$input);case"mask":_=v().join(""),$(d.el);break;case"format":ca=a({}),ca.data("_inputmask",{maskset:e,opts:f,isRTL:f.numericInput}),f.numericInput&&(ea=!0);var ja=(a.isFunction(f.onBeforeMask)?f.onBeforeMask.call(ca,d.value,f)||d.value:d.value).split("");return H(ca,!1,!1,ea?ja.reverse():ja),a.isFunction(f.onBeforeWrite)&&f.onBeforeWrite.call(this,void 0,v(),0,f),d.metadata?{value:ea?v().slice().reverse().join(""):v().join(""),metadata:ca.inputmask("getmetadata")}:ea?v().slice().reverse().join(""):v().join("");case"isValid":ca=a({}),ca.data("_inputmask",{maskset:e,opts:f,isRTL:f.numericInput}),f.numericInput&&(ea=!0);var ja=d.value.split("");H(ca,!1,!0,ea?ja.reverse():ja);for(var ka=v(),la=M(),ma=ka.length-1;ma>la&&!A(ma);ma--);return ka.splice(la,ma+1-la),O(ka)&&d.value==ka.join("");case"getemptymask":return ca=a(d.el),e=ca.data("_inputmask").maskset,f=ca.data("_inputmask").opts,u();case"remove":var na=d.el;ca=a(na),e=ca.data("_inputmask").maskset,f=ca.data("_inputmask").opts,na._valueSet(J(ca)),ca.unbind(".inputmask"),ca.removeData("_inputmask");var oa;Object.getOwnPropertyDescriptor&&(oa=Object.getOwnPropertyDescriptor(na,"value")),oa&&oa.get?na._valueGet&&Object.defineProperty(na,"value",{get:na._valueGet,set:na._valueSet}):document.__lookupGetter__&&na.__lookupGetter__("value")&&na._valueGet&&(na.__defineGetter__("value",na._valueGet),na.__defineSetter__("value",na._valueSet));try{delete na._valueGet,delete na._valueSet}catch(pa){na._valueGet=void 0,na._valueSet=void 0}break;case"getmetadata":if(ca=a(d.el),e=ca.data("_inputmask").maskset,f=ca.data("_inputmask").opts,a.isArray(e.metadata)){for(var qa,ra=n(),sa=ra;sa>=0;sa--)if(l().validPositions[sa]&&void 0!=l().validPositions[sa].alternation){qa=l().validPositions[sa].alternation;break}return void 0!=qa?e.metadata[l().validPositions[ra].locator[qa]]:e.metadata[0]}return e.metadata}}if(void 0===a.fn.inputmask){var g=navigator.userAgent,h=null!==g.match(new RegExp("iphone","i")),i=(null!==g.match(new RegExp("android.*safari.*","i")),null!==g.match(new RegExp("android.*chrome.*","i"))),j=null!==g.match(new RegExp("android.*firefox.*","i")),k=(/Kindle/i.test(g)||/Silk/i.test(g)||/KFTT/i.test(g)||/KFOT/i.test(g)||/KFJWA/i.test(g)||/KFJWI/i.test(g)||/KFSOWI/i.test(g)||/KFTHWA/i.test(g)||/KFTHWI/i.test(g)||/KFAPWA/i.test(g)||/KFAPWI/i.test(g),b("paste")?"paste":b("input")?"input":"propertychange");a.inputmask={defaults:{placeholder:"_",optionalmarker:{start:"[",end:"]"},quantifiermarker:{start:"{",end:"}"},groupmarker:{start:"(",end:")"},alternatormarker:"|",escapeChar:"\\",mask:null,oncomplete:a.noop,onincomplete:a.noop,oncleared:a.noop,repeat:0,greedy:!0,autoUnmask:!1,removeMaskOnSubmit:!1,clearMaskOnLostFocus:!0,insertMode:!0,clearIncomplete:!1,aliases:{},alias:null,onKeyDown:a.noop,onBeforeMask:void 0,onBeforePaste:void 0,onBeforeWrite:void 0,onUnMask:void 0,showMaskOnFocus:!0,showMaskOnHover:!0,onKeyValidation:a.noop,skipOptionalPartCharacter:" ",showTooltip:!1,numericInput:!1,rightAlign:!1,undoOnEscape:!0,radixPoint:"",radixFocus:!1,nojumps:!1,nojumpsThreshold:0,keepStatic:void 0,definitions:{9:{validator:"[0-9]",cardinality:1,definitionSymbol:"*"},a:{validator:"[A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",cardinality:1,definitionSymbol:"*"},"*":{validator:"[0-9A-Za-z\u0410-\u044f\u0401\u0451\xc0-\xff\xb5]",cardinality:1}},ignorables:[8,9,13,19,27,33,34,35,36,37,38,39,40,45,46,93,112,113,114,115,116,117,118,119,120,121,122,123],isComplete:void 0,canClearPosition:a.noop,postValidation:void 0},keyCode:{ALT:18,BACKSPACE:8,CAPS_LOCK:20,COMMA:188,COMMAND:91,COMMAND_LEFT:91,COMMAND_RIGHT:93,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,MENU:93,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38,WINDOWS:91},masksCache:{},escapeRegex:function(a){var b=["/",".","*","+","?","|","(",")","[","]","{","}","\\","$","^"];return a.replace(new RegExp("(\\"+b.join("|\\")+")","gim"),"\\$1")},format:function(b,c,g){var h=a.extend(!0,{},a.inputmask.defaults,c);return d(h.alias,c,h),f({action:"format",value:b,metadata:g},e(h,c&&void 0!==c.definitions),h)},isValid:function(b,c){var g=a.extend(!0,{},a.inputmask.defaults,c);return d(g.alias,c,g),f({action:"isValid",value:b},e(g,c&&void 0!==c.definitions),g)}},a.fn.inputmask=function(b,c){function g(b,c,e){var f=a(b);f.data("inputmask-alias")&&d(f.data("inputmask-alias"),a.extend(!0,{},c),c);for(var g in c){var h=f.data("inputmask-"+g.toLowerCase());void 0!=h&&("mask"==g&&0==h.indexOf("[")?(c[g]=h.replace(/[\s[\]]/g,"").split("','"),c[g][0]=c[g][0].replace("'",""),c[g][c[g].length-1]=c[g][c[g].length-1].replace("'","")):c[g]="boolean"==typeof h?h:h.toString(),e&&(e[g]=c[g]))}return c}var h,i=a.extend(!0,{},a.inputmask.defaults,c);if("string"==typeof b)switch(b){case"mask":return d(i.alias,c,i),this.each(function(){return g(this,i),h=e(i,c&&void 0!==c.definitions),void 0==h?this:void f({action:"mask",el:this},h,i)});case"unmaskedvalue":var j=a(this);return j.data("_inputmask")?f({action:"unmaskedvalue",$input:j}):j.val();case"remove":return this.each(function(){var b=a(this);b.data("_inputmask")&&f({action:"remove",el:this})});case"getemptymask":return this.data("_inputmask")?f({action:"getemptymask",el:this}):"";case"hasMaskedValue":return this.data("_inputmask")?!this.data("_inputmask").opts.autoUnmask:!1;case"isComplete":return this.data("_inputmask")?f({action:"isComplete",buffer:this[0]._valueGet().split(""),el:this}):!0;case"getmetadata":return this.data("_inputmask")?f({action:"getmetadata",el:this}):void 0;default:return d(i.alias,c,i),d(b,c,i)||(i.mask=b),this.each(function(){return g(this,i),h=e(i,c&&void 0!==c.definitions),void 0==h?this:void f({action:"mask",el:this},h,i)})}else{if("object"==typeof b)return i=a.extend(!0,{},a.inputmask.defaults,b),d(i.alias,b,i),this.each(function(){return g(this,i),h=e(i,b&&void 0!==b.definitions),void 0==h?this:void f({action:"mask",el:this},h,i)});if(void 0==b)return this.each(function(){var b=a(this).attr("data-inputmask");if(b&&""!=b)try{b=b.replace(new RegExp("'","g"),'"');var e=a.parseJSON("{"+b+"}");a.extend(!0,e,c),i=a.extend(!0,{},a.inputmask.defaults,e),i=g(this,i),d(i.alias,e,i),i.alias=void 0,a(this).inputmask("mask",i)}catch(f){}if(a(this).attr("data-inputmask-mask")||a(this).attr("data-inputmask-alias")){i=a.extend(!0,{},a.inputmask.defaults,{});var h={};i=g(this,i,h),d(i.alias,h,i),i.alias=void 0,a(this).inputmask("mask",i)}})}}}return a.fn.inputmask});
!function(e){"function"==typeof define&&define.amd?define(["jquery","./jquery.inputmask"],e):e(jQuery)}(function(e){return e.extend(e.inputmask.defaults.definitions,{A:{validator:"[A-Za-zА-яЁёÀ-ÿµ]",cardinality:1,casing:"upper"},"#":{validator:"[0-9A-Za-zА-яЁёÀ-ÿµ]",cardinality:1,casing:"upper"},U:{validator:"[А-Яа-яҐґЁёІіЄєЫыЇї'`‘\\-]",cardinality:1}}),e.extend(e.inputmask.defaults.aliases,{url:{mask:"ir",placeholder:"",separator:"",defaultPrefix:"http://",regex:{urlpre1:new RegExp("[fh]"),urlpre2:new RegExp("(ft|ht)"),urlpre3:new RegExp("(ftp|htt)"),urlpre4:new RegExp("(ftp:|http|ftps)"),urlpre5:new RegExp("(ftp:/|ftps:|http:|https)"),urlpre6:new RegExp("(ftp://|ftps:/|http:/|https:)"),urlpre7:new RegExp("(ftp://|ftps://|http://|https:/)"),urlpre8:new RegExp("(ftp://|ftps://|http://|https://)")},definitions:{i:{validator:function(){return!0},cardinality:8,prevalidator:function(){for(var e=[],t=8,r=0;t>r;r++)e[r]=function(){var e=r;return{validator:function(t,r,i,n,a){if(a.regex["urlpre"+(e+1)]){var f,p=t;e+1-t.length>0&&(p=r.buffer.join("").substring(0,e+1-t.length)+""+p);var u=a.regex["urlpre"+(e+1)].test(p);if(!n&&!u){for(i-=e,f=0;f<a.defaultPrefix.length;f++)r.buffer[i]=a.defaultPrefix[f],i++;for(f=0;f<p.length-1;f++)r.buffer[i]=p[f],i++;return{pos:i}}return u}return!1},cardinality:e}}();return e}()},r:{validator:".",cardinality:50}},insertMode:!1,autoUnmask:!1},ip:{mask:"i[i[i]].i[i[i]].i[i[i]].i[i[i]]",definitions:{i:{validator:function(e,t,r){return r-1>-1&&"."!=t.buffer[r-1]?(e=t.buffer[r-1]+e,e=r-2>-1&&"."!=t.buffer[r-2]?t.buffer[r-2]+e:"0"+e):e="00"+e,new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(e)},cardinality:1}}},email:{mask:"*{1,64}[.*{1,64}][.*{1,64}][.*{1,64}]@*{1,64}[.*{2,64}][.*{2,6}][.*{1,2}]",greedy:!1,onBeforePaste:function(e){return e=e.toLowerCase(),e.replace("mailto:","")},definitions:{"*":{validator:"[0-9A-Za-z!#$%&'*+/=?^_`{|}~-]",cardinality:1,casing:"lower"}}}}),e.fn.inputmask});
//# sourceMappingURL=jquery.inputmask.extensions.min.js.map
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
          _this.init();
        }
        return false;
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
    trustedUrl = this.$sceDelegate.trustAs(this.$sce.RESOURCE_URL, "" + this.$rootScope.settings.api.url + this.$rootScope.settings.api.command.get);
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
          _this.init();
        }
        return false;
      };
    })(this));
  }

  twoStepController.prototype.card_hover = function($event, card) {
    return this.$scope.cards_two.card_hover = $event.type === "mouseover" ? card : "";
  };

  twoStepController.prototype.init = function() {
    var maxDate, minDate;
    this.calendar = {};
    minDate = new Date();
    maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    minDate.setFullYear(minDate.getFullYear() - 90);
    this.initCal = (function(_this) {
      return function() {
        _this.calendar = _this.$iElement.find(".ui.calendar").calendar({
          type: "date",
          firstDayOfWeek: 1,
          ampm: false,
          minDate: minDate,
          maxDate: maxDate,
          initialDate: minDate,
          touchReadonly: false,
          disableMinute: true,
          popupOptions: {
            position: 'top right',
            lastResort: 'top right'
          },
          className: {
            prevIcon: "open icon left",
            nextIcon: "open icon right"
          },
          text: {
            days: ['В', 'П', 'В', 'С', 'Ч', 'П', 'С'],
            months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
            monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            today: 'Сегодня',
            now: 'Сейчас',
            am: 'AM',
            pm: 'PM'
          },
          formatter: {
            date: function(date, settings) {
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
            }
          }
        });
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
    var param;
    if (this.$scope.$storage.strgData.aggree === void 0) {
      this.$scope.$storage.strgData.aggree = true;
    }
    param = {
      mask: "+38 (099) 999-99-99",
      greedy: false,
      showMaskOnHover: false,
      oncomplete: (function(_this) {
        return function(e) {
          return _this.$scope.$storage.strgData.phone = e.target.value;
        };
      })(this)
    };
    $('input[name="phone"]').inputmask(param);
    param = {
      mask: "(09)|(19)|(29)|(30|1).(09)|(10|1|2).(1\\9)|(20)99",
      greedy: false,
      showMaskOnHover: false,
      oncomplete: (function(_this) {
        return function(e) {
          return _this.$scope.$storage.strgData.bday = e.target.value;
        };
      })(this)
    };
    $('input[name="bday"]').inputmask(param);
    param = {
      mask: "U{1,64} (U{1,64})|(U{1,64} U{1,64})",
      greedy: false,
      showMaskOnHover: false,
      oncomplete: (function(_this) {
        return function(e) {
          return _this.$scope.$storage.strgData.name = e.target.value;
        };
      })(this)
    };
    $('input[name="fullname"]').inputmask(param);
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
              type: "empty",
              prompt: "Неправильный номер телефона"
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
          _this.init("cities", function(responce) {
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
        return false;
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
    var _checkbox_noinn, _dropdown_city, _dropdown_employment, param;
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
      onChecked: (function(_this) {
        return function() {
          return _this.chngMsg("remove");
        };
      })(this),
      onUnchecked: (function(_this) {
        return function() {
          return _this.chngMsg("add");
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
    param = {
      mask: "([а-яёієыї\\-\\']+\\s[а-яёієыї\\-\\']+)?(\\s[а-яёієыї\\-\\']+)?",
      greedy: false,
      showMaskOnHover: false,
      oncomplete: (function(_this) {
        return function(e) {
          return _this.$scope.$storage.strgData.city = e.target.value;
        };
      })(this)
    };
    $('input[name="city"]').inputmask(param);
    param = {
      mask: "9999999999",
      greedy: false,
      showMaskOnHover: false,
      oncomplete: (function(_this) {
        return function(e) {
          return _this.$scope.$storage.strgData.inn = e.target.value;
        };
      })(this)
    };
    $('input[name="inn"]').inputmask(param);
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
    this.chngMsg("add");
    return this.$scope.main.loading = false;
  };

  threeStepController.prototype.chngMsg = function(comm) {
    var _checkbox, _form;
    _form = $(this.$element).find("form");
    _checkbox = this.$iElement.find(".ui.button.submit");
    if (comm === "add") {
      _form.form("add rule", "inn", {
        rules: [
          {
            type: "integer[10]",
            prompt: "Неправильный ИНН"
          }
        ]
      });
      return _checkbox.popup({
        transition: "horizontal flip",
        position: 'right center',
        target: '#inn',
        content: 'Без ИНН шансы на получение кредита значительно уменьшаются. Часть банков не будет рассматривать заявку, если отправить её без ИНН.'
      });
    } else {
      _form.form("remove fields", ["inn"]);
      _form.form("validate field", "inn");
      return _checkbox.popup("destroy");
    }
  };

  threeStepController.prototype.init = function(type, fn) {
    var clbck, params, trustedUrl;
    this.fn = fn;
    if (type) {
      params = {
        data: type
      };
      trustedUrl = this.$sceDelegate.trustAs(this.$sce.RESOURCE_URL, "" + this.$rootScope.settings.api.url + this.$rootScope.settings.api.command.get);
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

  threeStepController.prototype.post = function(type, fn) {
    var clbck, params, trustedUrl;
    this.fn = fn;
    if (type) {
      params = {
        data: type
      };
      trustedUrl = this.$sceDelegate.trustAs(this.$sce.RESOURCE_URL, "" + this.$rootScope.settings.api.url + this.$rootScope.settings.api.command.put);
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
var financeAppController;

financeAppController = (function() {
  function financeAppController($rootScope, $scope, $localStorage, $location, $window, $timeout, $route) {
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$location = $location;
    this.$window = $window;
    this.$timeout = $timeout;
    this.$route = $route;
    this.$scope.$storage = this.$storage = $localStorage.$default({
      strgData: {
        amount: 5000
      }
    });
    this.loading = true;
    this.statusReq = false;
    this.currentStep = 1;
    this.maxStep = 3;
    this.$window.addEventListener("eventWidgetStep1", function(e) {
      return console.log(e);
    });
    this.$window.addEventListener("eventWidgetStep2", function(e) {
      return console.log(e);
    });
    this.$window.addEventListener("eventWidgetStep3", function(e) {
      return console.log(e);
    });
    this.$window.addEventListener("eventWidgetSuccess", function(e) {
      return console.log(e);
    });
    this.$window.addEventListener("eventWidgetError", function(e) {
      return console.log(e);
    });
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
        console.log(_this.$location.path(), _this.currentStep, _currentNameStep);
        return _this.$timeout(function() {
          if (_this.currentStep === 1) {
            return _this.init();
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

  financeAppController.prototype.init = function() {
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

  financeAppController.prototype.titleStep = function() {
    return "Шаг " + this.currentStep + " из " + this.maxStep;
  };

  financeAppController.prototype.scrollTo = function($event, id) {
    return $("html, body").animate({
      scrollTop: $(id).offset().top
    }, 600);
  };

  financeAppController.prototype.sendEvent = function(evnt) {
    console.log(evnt);
    evnt = Object.get(this.$rootScope.settings.events, evnt);
    return this.$window.dispatchEvent(evnt);
  };

  return financeAppController;

})();

// Generated by CoffeeScript 1.12.5
angular.module('financeApp', ['finance-directives', 'ngRoute', 'ngSanitize', 'ngStorage']).config([
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
]).run([
  "$rootScope", "$http", "$location", function($rootScope, $http, $location) {
    var paramsEvent;
    $location.path("/s1");
    $http.defaults.useXDomain = true;
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
      api: {
        debug: true,
        url: "//credits.finance.ua/api/",
        command: {
          get: "list",
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
]).controller("financeAppController", ['$rootScope', '$scope', '$localStorage', '$location', '$window', '$timeout', '$route', financeAppController]);
