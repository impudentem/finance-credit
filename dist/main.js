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

!function(e){"function"==typeof define&&define.amd?define(["./dependencyLibs/inputmask.dependencyLib","./global/window","./global/document"],e):"object"==typeof exports?module.exports=e(require("./dependencyLibs/inputmask.dependencyLib"),require("./global/window"),require("./global/document")):window.Inputmask=e(window.dependencyLib||jQuery,window,document)}(function(e,t,n,i){function a(t,n,o){return this instanceof a?(this.el=i,this.events={},this.maskset=i,this.refreshValue=!1,!0!==o&&(e.isPlainObject(t)?n=t:(n=n||{},n.alias=t),this.opts=e.extend(!0,{},this.defaults,n),this.noMasksCache=n&&n.definitions!==i,this.userOptions=n||{},this.isRTL=this.opts.numericInput,r(this.opts.alias,n,this.opts)),void 0):new a(t,n,o)}function r(t,n,o){var s=a.prototype.aliases[t];return s?(s.alias&&r(s.alias,i,o),e.extend(!0,o,s),e.extend(!0,o,n),!0):(null===o.mask&&(o.mask=t),!1)}function o(t,n){function r(t,r,o){var s=!1;if(null!==t&&""!==t||(s=null!==o.regex,s?(t=o.regex,t=t.replace(/^(\^)(.*)(\$)$/,"$2")):(s=!0,t=".*")),1===t.length&&!1===o.greedy&&0!==o.repeat&&(o.placeholder=""),o.repeat>0||"*"===o.repeat||"+"===o.repeat){var l="*"===o.repeat?0:"+"===o.repeat?1:o.repeat;t=o.groupmarker.start+t+o.groupmarker.end+o.quantifiermarker.start+l+","+o.repeat+o.quantifiermarker.end}var u,c=s?"regex_"+o.regex:o.numericInput?t.split("").reverse().join(""):t;return a.prototype.masksCache[c]===i||!0===n?(u={mask:t,maskToken:a.prototype.analyseMask(t,s,o),validPositions:{},_buffer:i,buffer:i,tests:{},metadata:r,maskLength:i},!0!==n&&(a.prototype.masksCache[c]=u,u=e.extend(!0,{},a.prototype.masksCache[c]))):u=e.extend(!0,{},a.prototype.masksCache[c]),u}if(e.isFunction(t.mask)&&(t.mask=t.mask(t)),e.isArray(t.mask)){if(t.mask.length>1){t.keepStatic=null===t.keepStatic||t.keepStatic;var o=t.groupmarker.start;return e.each(t.numericInput?t.mask.reverse():t.mask,function(n,a){o.length>1&&(o+=t.groupmarker.end+t.alternatormarker+t.groupmarker.start),o+=a.mask===i||e.isFunction(a.mask)?a:a.mask}),o+=t.groupmarker.end,r(o,t.mask,t)}t.mask=t.mask.pop()}return t.mask&&t.mask.mask!==i&&!e.isFunction(t.mask.mask)?r(t.mask.mask,t.mask,t):r(t.mask,t.mask,t)}function s(r,o,l){function h(e,t,n){t=t||0;var a,r,o,s=[],u=0,c=v();do!0===e&&m().validPositions[u]?(o=m().validPositions[u],r=o.match,a=o.locator.slice(),s.push(!0===n?o.input:!1===n?r.nativeDef:L(u,r))):(o=y(u,a,u-1),r=o.match,a=o.locator.slice(),(!1===l.jitMasking||c>u||"number"==typeof l.jitMasking&&isFinite(l.jitMasking)&&l.jitMasking>u)&&s.push(!1===n?r.nativeDef:L(u,r))),u++;while((Q===i||Q>u)&&(null!==r.fn||""!==r.def)||t>u);return""===s[s.length-1]&&s.pop(),m().maskLength=u+1,s}function m(){return o}function d(e){var t=m();t.buffer=i,!0!==e&&(t.validPositions={},t.p=0)}function v(e,t,n){var a=-1,r=-1,o=n||m().validPositions;e===i&&(e=-1);for(var s in o){var l=parseInt(s);o[l]&&(t||!0!==o[l].generatedInput)&&(e>=l&&(a=l),l>=e&&(r=l))}return-1!==a&&e-a>1||e>r?a:r}function k(t,n,a,r){var o,s=t,u=e.extend(!0,{},m().validPositions),c=!1;for(m().p=t,o=n-1;o>=s;o--)m().validPositions[o]!==i&&(!0!==a&&(!m().validPositions[o].match.optionality&&function(e){var t=m().validPositions[e];if(t!==i&&null===t.match.fn){var n=m().validPositions[e-1],a=m().validPositions[e+1];return n!==i&&a!==i}return!1}(o)||!1===l.canClearPosition(m(),o,v(),r,l))||delete m().validPositions[o]);for(d(!0),o=s+1;o<=v();){for(;m().validPositions[s]!==i;)s++;if(s>o&&(o=s+1),m().validPositions[o]===i&&O(o))o++;else{var f=y(o);!1===c&&u[s]&&u[s].match.def===f.match.def?(m().validPositions[s]=e.extend(!0,{},u[s]),m().validPositions[s].input=f.input,delete m().validPositions[o],o++):P(s,f.match.def)?!1!==M(s,f.input||L(o),!0)&&(delete m().validPositions[o],o++,c=!0):O(o)||(o++,s--),s++}}d(!0)}function g(e,t){for(var n,a=e,r=v(),o=m().validPositions[r]||C(0)[0],s=o.alternation!==i?o.locator[o.alternation].toString().split(","):[],u=0;u<a.length&&(n=a[u],!(n.match&&(l.greedy&&!0!==n.match.optionalQuantifier||(!1===n.match.optionality||!1===n.match.newBlockMarker)&&!0!==n.match.optionalQuantifier)&&(o.alternation===i||o.alternation!==n.alternation||n.locator[o.alternation]!==i&&w(n.locator[o.alternation].toString().split(","),s)))||!0===t&&(null!==n.match.fn||/[0-9a-bA-Z]/.test(n.match.def)));u++);return n}function y(e,t,n){return m().validPositions[e]||g(C(e,t?t.slice():t,n))}function b(e){return m().validPositions[e]?m().validPositions[e]:C(e)[0]}function P(e,t){for(var n=!1,i=C(e),a=0;a<i.length;a++)if(i[a].match&&i[a].match.def===t){n=!0;break}return n}function C(t,n,a){function r(n,a,o,u){function f(o,u,v){function k(t,n){var i=0===e.inArray(t,n.matches);return i||e.each(n.matches,function(e,a){return!0===a.isQuantifier&&(i=k(t,n.matches[e-1]))?!1:void 0}),i}function g(t,n,a){var r,o;if(m().validPositions[t-1]&&a&&m().tests[t])for(var s=m().validPositions[t-1].locator,l=m().tests[t][0].locator,u=0;a>u;u++)if(s[u]!==l[u])return s.slice(a+1);return(m().tests[t]||m().validPositions[t])&&e.each(m().tests[t]||[m().validPositions[t]],function(e,t){var s=a!==i?a:t.alternation,l=t.locator[s]!==i?t.locator[s].toString().indexOf(n):-1;(o===i||o>l)&&-1!==l&&(r=t,o=l)}),r?r.locator.slice((a!==i?a:r.alternation)+1):a!==i?g(t,n):i}if(c>1e4)throw"Inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. "+m().mask;if(c===t&&o.matches===i)return p.push({match:o,locator:u.reverse(),cd:d}),!0;if(o.matches!==i){if(o.isGroup&&v!==o){if(o=f(n.matches[e.inArray(o,n.matches)+1],u))return!0}else if(o.isOptional){var y=o;if(o=r(o,a,u,v)){if(s=p[p.length-1].match,!k(s,y))return!0;h=!0,c=t}}else if(o.isAlternator){var b,P=o,C=[],E=p.slice(),x=u.length,A=a.length>0?a.shift():-1;if(-1===A||"string"==typeof A){var _,w=c,M=a.slice(),O=[];if("string"==typeof A)O=A.split(",");else for(_=0;_<P.matches.length;_++)O.push(_);for(var S=0;S<O.length;S++){if(_=parseInt(O[S]),p=[],a=g(c,_,x)||M.slice(),!0!==(o=f(P.matches[_]||n.matches[_],[_].concat(u),v)||o)&&o!==i&&O[O.length-1]<P.matches.length){var j=e.inArray(o,n.matches)+1;n.matches.length>j&&(o=f(n.matches[j],[j].concat(u.slice(1,u.length)),v))&&(O.push(j.toString()),e.each(p,function(e,t){t.alternation=u.length-1}))}b=p.slice(),c=w,p=[];for(var D=0;D<b.length;D++){var T=b[D],L=!1;T.alternation=T.alternation||x;for(var G=0;G<C.length;G++){var B=C[G];if("string"!=typeof A||-1!==e.inArray(T.locator[T.alternation].toString(),O)){if(function(e,t){return e.match.nativeDef===t.match.nativeDef||e.match.def===t.match.nativeDef||e.match.nativeDef===t.match.def}(T,B)){L=!0,T.alternation===B.alternation&&-1===B.locator[B.alternation].toString().indexOf(T.locator[T.alternation])&&(B.locator[B.alternation]=B.locator[B.alternation]+","+T.locator[T.alternation],B.alternation=T.alternation),T.match.nativeDef===B.match.def&&(T.locator[T.alternation]=B.locator[B.alternation],C.splice(C.indexOf(B),1,T));break}if(T.match.def===B.match.def){L=!1;break}if(function(e,n){return null===e.match.fn&&null!==n.match.fn&&n.match.fn.test(e.match.def,m(),t,!1,l,!1)}(T,B)||function(e,n){return null!==e.match.fn&&null!==n.match.fn&&n.match.fn.test(e.match.def.replace(/[\[\]]/g,""),m(),t,!1,l,!1)}(T,B)){T.alternation==B.alternation&&-1===T.locator[T.alternation].toString().indexOf(B.locator[B.alternation].toString().split("")[0])&&(T.na=T.na||T.locator[T.alternation].toString(),-1===T.na.indexOf(T.locator[T.alternation].toString().split("")[0])&&(T.na=T.na+","+T.locator[B.alternation].toString().split("")[0]),L=!0,T.locator[T.alternation]=B.locator[B.alternation].toString().split("")[0]+","+T.locator[T.alternation],C.splice(C.indexOf(B),0,T));break}}}L||C.push(T)}}"string"==typeof A&&(C=e.map(C,function(t,n){if(isFinite(n)){var a=t.alternation,r=t.locator[a].toString().split(",");t.locator[a]=i,t.alternation=i;for(var o=0;o<r.length;o++)-1!==e.inArray(r[o],O)&&(t.locator[a]!==i?(t.locator[a]+=",",t.locator[a]+=r[o]):t.locator[a]=parseInt(r[o]),t.alternation=a);if(t.locator[a]!==i)return t}})),p=E.concat(C),c=t,h=p.length>0,o=C.length>0,a=M.slice()}else o=f(P.matches[A]||n.matches[A],[A].concat(u),v);if(o)return!0}else if(o.isQuantifier&&v!==n.matches[e.inArray(o,n.matches)-1])for(var I=o,F=a.length>0?a.shift():0;F<(isNaN(I.quantifier.max)?F+1:I.quantifier.max)&&t>=c;F++){var R=n.matches[e.inArray(I,n.matches)-1];if(o=f(R,[F].concat(u),R)){if(s=p[p.length-1].match,s.optionalQuantifier=F>I.quantifier.min-1,k(s,R)){if(F>I.quantifier.min-1){h=!0,c=t;break}return!0}return!0}}else if(o=r(o,a,u,v))return!0}else c++}for(var v=a.length>0?a.shift():0;v<n.matches.length;v++)if(!0!==n.matches[v].isQuantifier){var k=f(n.matches[v],[v].concat(o),u);if(k&&c===t)return k;if(c>t)break}}function o(e){if(l.keepStatic&&t>0&&e.length>1+(""===e[e.length-1].match.def?1:0)&&!0!==e[0].match.optionality&&!0!==e[0].match.optionalQuantifier&&null===e[0].match.fn&&!/[0-9a-bA-Z]/.test(e[0].match.def)){if(m().validPositions[t-1]===i)return[g(e)];if(m().validPositions[t-1].alternation===e[0].alternation)return[g(e)];if(m().validPositions[t-1])return[g(e)]}return e}var s,u=m().maskToken,c=n?a:0,f=n?n.slice():[0],p=[],h=!1,d=n?n.join(""):"";if(t>-1){if(n===i){for(var v,k=t-1;(v=m().validPositions[k]||m().tests[k])===i&&k>-1;)k--;v!==i&&k>-1&&(f=function(t){var n=[];return e.isArray(t)||(t=[t]),t.length>0&&(t[0].alternation===i?(n=g(t.slice()).locator.slice(),0===n.length&&(n=t[0].locator.slice())):e.each(t,function(e,t){if(""!==t.def)if(0===n.length)n=t.locator.slice();else for(var i=0;i<n.length;i++)t.locator[i]&&-1===n[i].toString().indexOf(t.locator[i])&&(n[i]+=","+t.locator[i])})),n}(v),d=f.join(""),c=k)}if(m().tests[t]&&m().tests[t][0].cd===d)return o(m().tests[t]);for(var y=f.shift();y<u.length&&!(r(u[y],f,[y])&&c===t||c>t);y++);}return(0===p.length||h)&&p.push({match:{fn:null,cardinality:0,optionality:!0,casing:null,def:"",placeholder:""},locator:[],cd:d}),n!==i&&m().tests[t]?o(e.extend(!0,[],p)):(m().tests[t]=e.extend(!0,[],p),o(m().tests[t]))}function E(){return m()._buffer===i&&(m()._buffer=h(!1,1),m().buffer===i&&(m().buffer=m()._buffer.slice())),m()._buffer}function x(e){return m().buffer!==i&&!0!==e||(m().buffer=h(!0,v(),!0)),m().buffer}function A(e,t,n){var a,r;if(!0===e)d(),e=0,t=n.length;else for(a=e;t>a;a++)delete m().validPositions[a];for(r=e,a=e;t>a;a++)if(d(!0),n[a]!==l.skipOptionalPartCharacter){var o=M(r,n[a],!0,!0);!1!==o&&(d(!0),r=o.caret!==i?o.caret:o.pos+1)}}function _(t,n,i){switch(l.casing||n.casing){case"upper":t=t.toUpperCase();break;case"lower":t=t.toLowerCase();break;case"title":var r=m().validPositions[i-1];t=0===i||r&&r.input===String.fromCharCode(a.keyCode.SPACE)?t.toUpperCase():t.toLowerCase();break;default:if(e.isFunction(l.casing)){var o=Array.prototype.slice.call(arguments);o.push(m().validPositions),t=l.casing.apply(this,o)}}return t}function w(t,n,a){for(var r,o=l.greedy?n:n.slice(0,1),s=!1,u=a!==i?a.split(","):[],c=0;c<u.length;c++)-1!==(r=t.indexOf(u[c]))&&t.splice(r,1);for(var f=0;f<t.length;f++)if(-1!==e.inArray(t[f],o)){s=!0;break}return s}function M(t,n,r,o,s,u){function c(e){var t=z?e.begin-e.end>1||e.begin-e.end==1:e.end-e.begin>1||e.end-e.begin==1;return t&&0===e.begin&&e.end===m().maskLength?"full":t}function f(n,a,r){var s=!1;return e.each(C(n),function(u,f){for(var h=f.match,g=a?1:0,y="",b=h.cardinality;b>g;b--)y+=D(n-(b-1));if(a&&(y+=a),x(!0),!1!==(s=null!=h.fn?h.fn.test(y,m(),n,r,l,c(t)):(a===h.def||a===l.skipOptionalPartCharacter)&&""!==h.def&&{c:L(n,h,!0)||h.def,pos:n})){var P=s.c!==i?s.c:a;P=P===l.skipOptionalPartCharacter&&null===h.fn?L(n,h,!0)||h.def:P;var C=n,E=x();if(s.remove!==i&&(e.isArray(s.remove)||(s.remove=[s.remove]),e.each(s.remove.sort(function(e,t){return t-e}),function(e,t){k(t,t+1,!0)})),s.insert!==i&&(e.isArray(s.insert)||(s.insert=[s.insert]),e.each(s.insert.sort(function(e,t){return e-t}),function(e,t){M(t.pos,t.c,!0,o)})),s.refreshFromBuffer){var w=s.refreshFromBuffer;if(A(!0===w?w:w.start,w.end,E),s.pos===i&&s.c===i)return s.pos=v(),!1;if((C=s.pos!==i?s.pos:n)!==n)return s=e.extend(s,M(C,P,!0,o)),!1}else if(!0!==s&&s.pos!==i&&s.pos!==n&&(C=s.pos,A(n,C,x().slice()),C!==n))return s=e.extend(s,M(C,P,!0)),!1;return(!0===s||s.pos!==i||s.c!==i)&&(u>0&&d(!0),p(C,e.extend({},f,{input:_(P,h,C)}),o,c(t))||(s=!1),!1)}}),s}function p(t,n,a,r){if(r||l.insertMode&&m().validPositions[t]!==i&&a===i){var o,s=e.extend(!0,{},m().validPositions),u=v(i,!0);for(o=t;u>=o;o++)delete m().validPositions[o];m().validPositions[t]=e.extend(!0,{},n);var c,f=!0,p=m().validPositions,k=!1,g=m().maskLength;for(o=c=t;u>=o;o++){var y=s[o];if(y!==i)for(var b=c;b<m().maskLength&&(null===y.match.fn&&p[o]&&(!0===p[o].match.optionalQuantifier||!0===p[o].match.optionality)||null!=y.match.fn);){if(b++,!1===k&&s[b]&&s[b].match.def===y.match.def)m().validPositions[b]=e.extend(!0,{},s[b]),m().validPositions[b].input=y.input,h(b),c=b,f=!0;else if(P(b,y.match.def)){var C=M(b,y.input,!0,!0);f=!1!==C,c=C.caret||C.insert?v():b,k=!0}else if(!(f=!0===y.generatedInput)&&b>=m().maskLength-1)break;if(m().maskLength<g&&(m().maskLength=g),f)break}if(!f)break}if(!f)return m().validPositions=e.extend(!0,{},s),d(!0),!1}else m().validPositions[t]=e.extend(!0,{},n);return d(!0),!0}function h(t){for(var n=t-1;n>-1&&!m().validPositions[n];n--);var a,r;for(n++;t>n;n++)m().validPositions[n]===i&&(!1===l.jitMasking||l.jitMasking>n)&&(r=C(n,y(n-1).locator,n-1).slice(),""===r[r.length-1].match.def&&r.pop(),(a=g(r))&&(a.match.def===l.radixPointDefinitionSymbol||!O(n,!0)||e.inArray(l.radixPoint,x())<n&&a.match.fn&&a.match.fn.test(L(n),m(),n,!1,l))&&!1!==(E=f(n,L(n,a.match,!0)||(null==a.match.fn?a.match.def:""!==L(n)?L(n):x()[n]),!0))&&(m().validPositions[E.pos||n].generatedInput=!0))}r=!0===r;var b=t;t.begin!==i&&(b=z&&!c(t)?t.end:t.begin);var E=!0,j=e.extend(!0,{},m().validPositions);if(e.isFunction(l.preValidation)&&!r&&!0!==o&&!0!==u&&(E=l.preValidation(x(),b,n,c(t),l)),!0===E){if(h(b),c(t)&&(K(i,a.keyCode.DELETE,t,!0,!0),b=m().p),b<m().maskLength&&(Q===i||Q>b)&&(E=f(b,n,r),(!r||!0===o)&&!1===E&&!0!==u)){var T=m().validPositions[b];if(!T||null!==T.match.fn||T.match.def!==n&&n!==l.skipOptionalPartCharacter){if((l.insertMode||m().validPositions[S(b)]===i)&&!O(b,!0))for(var G=b+1,B=S(b);B>=G;G++)if(!1!==(E=f(G,n,r))){!function(t,n){var a=m().validPositions[n];if(a)for(var r=a.locator,o=r.length,s=t;n>s;s++)if(m().validPositions[s]===i&&!O(s,!0)){var l=C(s).slice(),u=g(l,!0),c=-1;""===l[l.length-1].match.def&&l.pop(),e.each(l,function(e,t){for(var n=0;o>n;n++){if(t.locator[n]===i||!w(t.locator[n].toString().split(","),r[n].toString().split(","),t.na)){var a=r[n],s=u.locator[n],l=t.locator[n];a-s>Math.abs(a-l)&&(u=t);break}n>c&&(c=n,u=t)}}),u=e.extend({},u,{input:L(s,u.match,!0)||u.match.def}),u.generatedInput=!0,p(s,u,!0),m().validPositions[n]=i,f(n,a.input,!0)}}(b,E.pos!==i?E.pos:G),b=G;break}}else E={caret:S(b)}}!1===E&&l.keepStatic&&!r&&!0!==s&&(E=function(t,n,a){var r,s,u,c,f,p,h,k,g=e.extend(!0,{},m().validPositions),y=!1,b=v();for(c=m().validPositions[b];b>=0;b--)if((u=m().validPositions[b])&&u.alternation!==i){if(r=b,s=m().validPositions[r].alternation,c.locator[u.alternation]!==u.locator[u.alternation])break;c=u}if(s!==i){k=parseInt(r);var P=c.locator[c.alternation||s]!==i?c.locator[c.alternation||s]:h[0];P.length>0&&(P=P.split(",")[0]);var E=m().validPositions[k],x=m().validPositions[k-1];e.each(C(k,x?x.locator:i,k-1),function(r,u){h=u.locator[s]?u.locator[s].toString().split(","):[];for(var c=0;c<h.length;c++){var b=[],C=0,x=0,A=!1;if(P<h[c]&&(u.na===i||-1===e.inArray(h[c],u.na.split(","))||-1===e.inArray(P.toString(),h))){m().validPositions[k]=e.extend(!0,{},u);var _=m().validPositions[k].locator;for(m().validPositions[k].locator[s]=parseInt(h[c]),null==u.match.fn?(E.input!==u.match.def&&(A=!0,!0!==E.generatedInput&&b.push(E.input)),x++,m().validPositions[k].generatedInput=!/[0-9a-bA-Z]/.test(u.match.def),m().validPositions[k].input=u.match.def):m().validPositions[k].input=E.input,f=k+1;f<v(i,!0)+1;f++)p=m().validPositions[f],p&&!0!==p.generatedInput&&/[0-9a-bA-Z]/.test(p.input)?b.push(p.input):t>f&&C++,delete m().validPositions[f];for(A&&b[0]===u.match.def&&b.shift(),d(!0),y=!0;b.length>0;){var w=b.shift();if(w!==l.skipOptionalPartCharacter&&!(y=M(v(i,!0)+1,w,!1,o,!0)))break}if(y){m().validPositions[k].locator=_;var O=v(t)+1;for(f=k+1;f<v()+1;f++)((p=m().validPositions[f])===i||null==p.match.fn)&&t+(x-C)>f&&x++;t+=x-C,y=M(t>O?O:t,n,a,o,!0)}if(y)return!1;d(),m().validPositions=e.extend(!0,{},g)}}})}return y}(b,n,r)),!0===E&&(E={pos:b})}if(e.isFunction(l.postValidation)&&!1!==E&&!r&&!0!==o&&!0!==u){var I=l.postValidation(x(!0),E,l);if(I.refreshFromBuffer&&I.buffer){var F=I.refreshFromBuffer;A(!0===F?F:F.start,F.end,I.buffer)}E=!0===I?E:I}return E&&E.pos===i&&(E.pos=b),!1!==E&&!0!==u||(d(!0),m().validPositions=e.extend(!0,{},j)),E}function O(e,t){var n=y(e).match;if(""===n.def&&(n=b(e).match),null!=n.fn)return n.fn;if(!0!==t&&e>-1){var i=C(e);return i.length>1+(""===i[i.length-1].match.def?1:0)}return!1}function S(e,t){var n=m().maskLength;if(e>=n)return n;var i=e;for(C(n+1).length>1&&(h(!0,n+1,!0),n=m().maskLength);++i<n&&(!0===t&&(!0!==b(i).match.newBlockMarker||!O(i))||!0!==t&&!O(i)););return i}function j(e,t){var n,i=e;if(0>=i)return 0;for(;--i>0&&(!0===t&&!0!==b(i).match.newBlockMarker||!0!==t&&!O(i)&&(n=C(i),n.length<2||2===n.length&&""===n[1].match.def)););return i}function D(e){return m().validPositions[e]===i?L(e):m().validPositions[e].input}function T(t,n,a,r,o){if(r&&e.isFunction(l.onBeforeWrite)){var s=l.onBeforeWrite.call($,r,n,a,l);if(s){if(s.refreshFromBuffer){var u=s.refreshFromBuffer;A(!0===u?u:u.start,u.end,s.buffer||n),n=x(!0)}a!==i&&(a=s.caret!==i?s.caret:a)}}t!==i&&(t.inputmask._valueSet(n.join("")),a===i||r!==i&&"blur"===r.type?U(t,a,0===n.length):p&&r&&"input"===r.type?setTimeout(function(){I(t,a)},0):I(t,a),!0===o&&(J=!0,e(t).trigger("input")))}function L(t,n,a){if(n=n||b(t).match,n.placeholder!==i||!0===a)return e.isFunction(n.placeholder)?n.placeholder(l):n.placeholder;if(null===n.fn){if(t>-1&&m().validPositions[t]===i){var r,o=C(t),s=[];if(o.length>1+(""===o[o.length-1].match.def?1:0))for(var u=0;u<o.length;u++)if(!0!==o[u].match.optionality&&!0!==o[u].match.optionalQuantifier&&(null===o[u].match.fn||r===i||!1!==o[u].match.fn.test(r.match.def,m(),t,!0,l))&&(s.push(o[u]),null===o[u].match.fn&&(r=o[u]),s.length>1&&/[0-9a-bA-Z]/.test(s[0].match.def)))return l.placeholder.charAt(t%l.placeholder.length)}return n.def}return l.placeholder.charAt(t%l.placeholder.length)}function G(t,r,o,s,u){function c(e,t){return-1!==E().slice(e,S(e)).join("").indexOf(t)&&!O(e)&&b(e).match.nativeDef===t.charAt(t.length-1)}var f=s.slice(),p="",h=-1,k=i;if(d(),o||!0===l.autoUnmask)h=S(h);else{var g=E().slice(0,S(-1)).join(""),P=f.join("").match(new RegExp("^"+a.escapeRegex(g),"g"));P&&P.length>0&&(f.splice(0,P.length*g.length),h=S(h))}if(-1===h?(m().p=S(h),h=0):m().p=h,e.each(f,function(n,a){if(a!==i)if(m().validPositions[n]===i&&f[n]===L(n)&&O(n,!0)&&!1===M(n,f[n],!0,i,i,!0))m().p++;else{var r=new e.Event("_checkval");r.which=a.charCodeAt(0),p+=a;var s=v(i,!0),u=m().validPositions[s],g=y(s+1,u?u.locator.slice():i,s);if(!c(h,p)||o||l.autoUnmask){var b=o?n:null==g.match.fn&&g.match.optionality&&s+1<m().p?s+1:m().p;k=ne.keypressEvent.call(t,r,!0,!1,o,b),h=b+1,p=""}else k=ne.keypressEvent.call(t,r,!0,!1,!0,s+1);if(!1!==k&&!o&&e.isFunction(l.onBeforeWrite)){var P=k;if(k=l.onBeforeWrite.call($,r,x(),k.forwardPosition,l),(k=e.extend(P,k))&&k.refreshFromBuffer){var C=k.refreshFromBuffer;A(!0===C?C:C.start,C.end,k.buffer),d(!0),k.caret&&(m().p=k.caret,k.forwardPosition=k.caret)}}}}),r){var C=i;n.activeElement===t&&k&&(C=l.numericInput?j(k.forwardPosition):k.forwardPosition),T(t,x(),C,u||new e.Event("checkval"),u&&"input"===u.type)}}function B(t){if(t){if(t.inputmask===i)return t.value;t.inputmask&&t.inputmask.refreshValue&&ne.setValueEvent.call(t)}var n=[],a=m().validPositions;for(var r in a)a[r].match&&null!=a[r].match.fn&&n.push(a[r].input);var o=0===n.length?"":(z?n.reverse():n).join("");if(e.isFunction(l.onUnMask)){var s=(z?x().slice().reverse():x()).join("");o=l.onUnMask.call($,s,o,l)}return o}function I(e,a,r,o){function s(e){return!0===o||!z||"number"!=typeof e||l.greedy&&""===l.placeholder||(e=x().join("").length-e),e}var c;if(a===i)return e.setSelectionRange?(a=e.selectionStart,r=e.selectionEnd):t.getSelection?(c=t.getSelection().getRangeAt(0),c.commonAncestorContainer.parentNode!==e&&c.commonAncestorContainer!==e||(a=c.startOffset,r=c.endOffset)):n.selection&&n.selection.createRange&&(c=n.selection.createRange(),a=0-c.duplicate().moveStart("character",-e.inputmask._valueGet().length),r=a+c.text.length),{begin:s(a),end:s(r)};if(a.begin!==i&&(r=a.end,a=a.begin),"number"==typeof a){a=s(a),r=s(r),r="number"==typeof r?r:a;var f=parseInt(((e.ownerDocument.defaultView||t).getComputedStyle?(e.ownerDocument.defaultView||t).getComputedStyle(e,null):e.currentStyle).fontSize)*r;if(e.scrollLeft=f>e.scrollWidth?f:0,u||!1!==l.insertMode||a!==r||r++,e.setSelectionRange)e.selectionStart=a,e.selectionEnd=r;else if(t.getSelection){if(c=n.createRange(),e.firstChild===i||null===e.firstChild){var p=n.createTextNode("");e.appendChild(p)}c.setStart(e.firstChild,a<e.inputmask._valueGet().length?a:e.inputmask._valueGet().length),c.setEnd(e.firstChild,r<e.inputmask._valueGet().length?r:e.inputmask._valueGet().length),c.collapse(!0);var h=t.getSelection();h.removeAllRanges(),h.addRange(c)}else e.createTextRange&&(c=e.createTextRange(),c.collapse(!0),c.moveEnd("character",r),c.moveStart("character",a),c.select());U(e,{begin:a,end:r})}}function F(t){var n,a,r=x(),o=r.length,s=v(),l={},u=m().validPositions[s],c=u!==i?u.locator.slice():i;for(n=s+1;n<r.length;n++)a=y(n,c,n-1),c=a.locator.slice(),l[n]=e.extend(!0,{},a);var f=u&&u.alternation!==i?u.locator[u.alternation]:i;for(n=o-1;n>s&&(a=l[n],(a.match.optionality||a.match.optionalQuantifier&&a.match.newBlockMarker||f&&(f!==l[n].locator[u.alternation]&&null!=a.match.fn||null===a.match.fn&&a.locator[u.alternation]&&w(a.locator[u.alternation].toString().split(","),f.toString().split(","))&&""!==C(n)[0].def))&&r[n]===L(n,a.match));n--)o--;return t?{l:o,def:l[o]?l[o].match:i}:o}function R(e){for(var t,n=F(),a=e.length,r=m().validPositions[v()];a>n&&!O(n,!0)&&(t=r!==i?y(n,r.locator.slice(""),r):b(n))&&!0!==t.match.optionality&&(!0!==t.match.optionalQuantifier&&!0!==t.match.newBlockMarker||n+1===a&&""===(r!==i?y(n+1,r.locator.slice(""),r):b(n+1)).match.def);)n++;for(;(t=m().validPositions[n-1])&&t&&t.match.optionality&&t.input===l.skipOptionalPartCharacter;)n--;return e.splice(n),e}function N(t){if(e.isFunction(l.isComplete))return l.isComplete(t,l);if("*"===l.repeat)return i;var n=!1,a=F(!0),r=j(a.l);if(a.def===i||a.def.newBlockMarker||a.def.optionality||a.def.optionalQuantifier){n=!0;for(var o=0;r>=o;o++){var s=y(o).match;if(null!==s.fn&&m().validPositions[o]===i&&!0!==s.optionality&&!0!==s.optionalQuantifier||null===s.fn&&t[o]!==L(o,s)){n=!1;break}}}return n}function K(t,n,r,o,s){if((l.numericInput||z)&&(n===a.keyCode.BACKSPACE?n=a.keyCode.DELETE:n===a.keyCode.DELETE&&(n=a.keyCode.BACKSPACE),z)){var u=r.end;r.end=r.begin,r.begin=u}n===a.keyCode.BACKSPACE&&(r.end-r.begin<1||!1===l.insertMode)?(r.begin=j(r.begin),m().validPositions[r.begin]!==i&&m().validPositions[r.begin].input===l.groupSeparator&&r.begin--):n===a.keyCode.DELETE&&r.begin===r.end&&(r.end=O(r.end,!0)&&m().validPositions[r.end]&&m().validPositions[r.end].input!==l.radixPoint?r.end+1:S(r.end)+1,m().validPositions[r.begin]!==i&&m().validPositions[r.begin].input===l.groupSeparator&&r.end++),k(r.begin,r.end,!1,o),!0!==o&&function(){if(l.keepStatic){for(var n=[],a=v(-1,!0),r=e.extend(!0,{},m().validPositions),o=m().validPositions[a];a>=0;a--){var s=m().validPositions[a];if(s){if(!0!==s.generatedInput&&/[0-9a-bA-Z]/.test(s.input)&&n.push(s.input),delete m().validPositions[a],s.alternation!==i&&s.locator[s.alternation]!==o.locator[s.alternation])break;o=s}}if(a>-1)for(m().p=S(v(-1,!0));n.length>0;){var u=new e.Event("keypress");u.which=n.pop().charCodeAt(0),ne.keypressEvent.call(t,u,!0,!1,!1,m().p)}else m().validPositions=e.extend(!0,{},r)}}();var c=v(r.begin,!0);if(c<r.begin)m().p=S(c);else if(!0!==o&&(m().p=r.begin,!0!==s))for(;m().p<c&&m().validPositions[m().p]===i;)m().p++}function V(i){function a(e){var t,a=n.createElement("span");for(var o in r)isNaN(o)&&-1!==o.indexOf("font")&&(a.style[o]=r[o]);a.style.textTransform=r.textTransform,a.style.letterSpacing=r.letterSpacing,a.style.position="absolute",a.style.height="auto",a.style.width="auto",a.style.visibility="hidden",a.style.whiteSpace="nowrap",n.body.appendChild(a);var s,l=i.inputmask._valueGet(),u=0;for(t=0,s=l.length;s>=t;t++){if(a.innerHTML+=l.charAt(t)||"_",a.offsetWidth>=e){var c=e-u,f=a.offsetWidth-e;a.innerHTML=l.charAt(t),c-=a.offsetWidth/3,t=f>c?t-1:t;break}u=a.offsetWidth}return n.body.removeChild(a),t}var r=(i.ownerDocument.defaultView||t).getComputedStyle(i,null),o=n.createElement("div");o.style.width=r.width,o.style.textAlign=r.textAlign,W=n.createElement("div"),W.className="im-colormask",i.parentNode.insertBefore(W,i),i.parentNode.removeChild(i),W.appendChild(o),W.appendChild(i),i.style.left=o.offsetLeft+"px",e(i).on("click",function(e){return I(i,a(e.clientX)),ne.clickEvent.call(i,[e])}),e(i).on("keydown",function(e){e.shiftKey||!1===l.insertMode||setTimeout(function(){U(i)},0)})}function U(e,t,a){function r(){p||null!==s.fn&&u.input!==i?p&&(null!==s.fn&&u.input!==i||""===s.def)&&(p=!1,f+="</span>"):(p=!0,f+="<span class='im-static'>")}function o(i){!0!==i&&h!==t.begin||n.activeElement!==e||(f+="<span class='im-caret' style='border-right-width: 1px;border-right-style: solid;'></span>")}var s,u,c,f="",p=!1,h=0;if(W!==i){var d=x();if(t===i?t=I(e):t.begin===i&&(t={begin:t,end:t}),!0!==a){var k=v();do o(),m().validPositions[h]?(u=m().validPositions[h],s=u.match,c=u.locator.slice(),r(),f+=d[h]):(u=y(h,c,h-1),s=u.match,c=u.locator.slice(),(!1===l.jitMasking||k>h||"number"==typeof l.jitMasking&&isFinite(l.jitMasking)&&l.jitMasking>h)&&(r(),f+=L(h,s))),h++;while((Q===i||Q>h)&&(null!==s.fn||""!==s.def)||k>h||p);-1===f.indexOf("im-caret")&&o(!0),p&&r()}var g=W.getElementsByTagName("div")[0];g.innerHTML=f,e.inputmask.positionColorMask(e,g)}}o=o||this.maskset,l=l||this.opts;var H,q,Q,W,$=this,Z=this.el,z=this.isRTL,X=!1,J=!1,Y=!1,ee=!1,te={on:function(t,n,r){var o=function(t){if(this.inputmask===i&&"FORM"!==this.nodeName){var n=e.data(this,"_inputmask_opts");n?new a(n).mask(this):te.off(this)}else{if("setvalue"===t.type||"FORM"===this.nodeName||!(this.disabled||this.readOnly&&!("keydown"===t.type&&t.ctrlKey&&67===t.keyCode||!1===l.tabThrough&&t.keyCode===a.keyCode.TAB))){switch(t.type){case"input":if(!0===J)return J=!1,t.preventDefault();break;case"keydown":X=!1,J=!1;break;case"keypress":if(!0===X)return t.preventDefault();X=!0;break;case"click":if(c||f){var o=this,s=arguments;return setTimeout(function(){r.apply(o,s)},0),!1}}var u=r.apply(this,arguments);return!1===u&&(t.preventDefault(),t.stopPropagation()),u}t.preventDefault()}};t.inputmask.events[n]=t.inputmask.events[n]||[],t.inputmask.events[n].push(o),-1!==e.inArray(n,["submit","reset"])?null!=t.form&&e(t.form).on(n,o):e(t).on(n,o)},off:function(t,n){if(t.inputmask&&t.inputmask.events){var i;n?(i=[],i[n]=t.inputmask.events[n]):i=t.inputmask.events,e.each(i,function(n,i){for(;i.length>0;){var a=i.pop();-1!==e.inArray(n,["submit","reset"])?null!=t.form&&e(t.form).off(n,a):e(t).off(n,a)}delete t.inputmask.events[n]})}}},ne={keydownEvent:function(t){var i=this,r=e(i),o=t.keyCode,s=I(i);if(o===a.keyCode.BACKSPACE||o===a.keyCode.DELETE||f&&o===a.keyCode.BACKSPACE_SAFARI||t.ctrlKey&&o===a.keyCode.X&&!function(e){var t=n.createElement("input"),i="on"+e,a=i in t;return a||(t.setAttribute(i,"return;"),a="function"==typeof t[i]),t=null,a}("cut"))t.preventDefault(),K(i,o,s),T(i,x(!0),m().p,t,i.inputmask._valueGet()!==x().join("")),i.inputmask._valueGet()===E().join("")?r.trigger("cleared"):!0===N(x())&&r.trigger("complete");else if(o===a.keyCode.END||o===a.keyCode.PAGE_DOWN){t.preventDefault();var u=S(v());l.insertMode||u!==m().maskLength||t.shiftKey||u--,I(i,t.shiftKey?s.begin:u,u,!0)}else o===a.keyCode.HOME&&!t.shiftKey||o===a.keyCode.PAGE_UP?(t.preventDefault(),I(i,0,t.shiftKey?s.begin:0,!0)):(l.undoOnEscape&&o===a.keyCode.ESCAPE||90===o&&t.ctrlKey)&&!0!==t.altKey?(G(i,!0,!1,H.split("")),r.trigger("click")):o!==a.keyCode.INSERT||t.shiftKey||t.ctrlKey?!0===l.tabThrough&&o===a.keyCode.TAB?(!0===t.shiftKey?(null===b(s.begin).match.fn&&(s.begin=S(s.begin)),s.end=j(s.begin,!0),s.begin=j(s.end,!0)):(s.begin=S(s.begin,!0),s.end=S(s.begin,!0),s.end<m().maskLength&&s.end--),s.begin<m().maskLength&&(t.preventDefault(),I(i,s.begin,s.end))):t.shiftKey||!1===l.insertMode&&(o===a.keyCode.RIGHT?setTimeout(function(){var e=I(i);I(i,e.begin)},0):o===a.keyCode.LEFT&&setTimeout(function(){var e=I(i);I(i,z?e.begin+1:e.begin-1)},0)):(l.insertMode=!l.insertMode,I(i,l.insertMode||s.begin!==m().maskLength?s.begin:s.begin-1));l.onKeyDown.call(this,t,x(),I(i).begin,l),Y=-1!==e.inArray(o,l.ignorables)},keypressEvent:function(t,n,r,o,s){var u=this,c=e(u),f=t.which||t.charCode||t.keyCode;if(!(!0===n||t.ctrlKey&&t.altKey)&&(t.ctrlKey||t.metaKey||Y))return f===a.keyCode.ENTER&&H!==x().join("")&&(H=x().join(""),setTimeout(function(){c.trigger("change")},0)),!0;if(f){46===f&&!1===t.shiftKey&&""!==l.radixPoint&&(f=l.radixPoint.charCodeAt(0));var p,h=n?{begin:s,end:s}:I(u),v=String.fromCharCode(f);m().writeOutBuffer=!0;var k=M(h,v,o);if(!1!==k&&(d(!0),p=k.caret!==i?k.caret:n?k.pos+1:S(k.pos),m().p=p),!1!==r&&(setTimeout(function(){l.onKeyValidation.call(u,f,k,l)},0),m().writeOutBuffer&&!1!==k)){var g=x();T(u,g,l.numericInput&&k.caret===i?j(p):p,t,!0!==n),!0!==n&&setTimeout(function(){!0===N(g)&&c.trigger("complete")},0)}if(t.preventDefault(),n)return!1!==k&&(k.forwardPosition=p),k}},pasteEvent:function(n){var i,a=this,r=n.originalEvent||n,o=e(a),s=a.inputmask._valueGet(!0),u=I(a);z&&(i=u.end,u.end=u.begin,u.begin=i);var c=s.substr(0,u.begin),f=s.substr(u.end,s.length);if(c===(z?E().reverse():E()).slice(0,u.begin).join("")&&(c=""),f===(z?E().reverse():E()).slice(u.end).join("")&&(f=""),z&&(i=c,c=f,f=i),t.clipboardData&&t.clipboardData.getData)s=c+t.clipboardData.getData("Text")+f;else{if(!r.clipboardData||!r.clipboardData.getData)return!0;s=c+r.clipboardData.getData("text/plain")+f}var p=s;if(e.isFunction(l.onBeforePaste)){if(!1===(p=l.onBeforePaste.call($,s,l)))return n.preventDefault();p||(p=s)}return G(a,!1,!1,z?p.split("").reverse():p.toString().split("")),T(a,x(),S(v()),n,H!==x().join("")),!0===N(x())&&o.trigger("complete"),n.preventDefault()},inputFallBackEvent:function(t){var n=this,i=n.inputmask._valueGet();if(x().join("")!==i){var r=I(n);if(!1===function(t,n,i){if("."===n.charAt(i.begin-1)&&""!==l.radixPoint&&(n=n.split(""),n[i.begin-1]=l.radixPoint.charAt(0),n=n.join("")),n.charAt(i.begin-1)===l.radixPoint&&n.length>x().length){var a=new e.Event("keypress");return a.which=l.radixPoint.charCodeAt(0),ne.keypressEvent.call(t,a,!0,!0,!1,i.begin-1),!1}}(n,i,r))return!1;if(i=i.replace(new RegExp("("+a.escapeRegex(E().join(""))+")*"),""),!1===function(t,n,i){if(c){var a=n.replace(x().join(""),"");if(1===a.length){var r=new e.Event("keypress");return r.which=a.charCodeAt(0),ne.keypressEvent.call(t,r,!0,!0,!1,m().validPositions[i.begin-1]?i.begin:i.begin-1),!1}}}(n,i,r))return!1;r.begin>i.length&&(I(n,i.length),r=I(n));var o=x().join(""),s=i.substr(0,r.begin),u=i.substr(r.begin),f=o.substr(0,r.begin),h=o.substr(r.begin),d=r,k=0;if(u===h||s===f){if(d={begin:s.length},s[s.length-1]!==f[f.length-1]&&(d.begin--,k++),u.length>h.length)d.end=d.begin;else{var g=h.replace(new RegExp(a.escapeRegex(u)+"$"),"");d.end=d.begin+g.length+k}d.begin!==d.end||O(d.begin)||(d.end=r.end)}if(d.begin<d.end)T(n,x(),d),s.split("")[s.length-1]!==f.split("")[f.length-1]?(t.which=s.charCodeAt(s.length-1),Y=!1,ne.keypressEvent.call(n,t)):(d.begin===d.end-1&&I(n,j(d.begin+1),d.end),t.keyCode=a.keyCode.DELETE,ne.keydownEvent.call(n,t));
else{if(-1===v()){for(var y=E().join("");null===i.match(a.escapeRegex(y)+"$");)y=y.slice(1);i=i.replace(y,"")}e.isFunction(l.onBeforeMask)&&(i=l.onBeforeMask.call($,i,l)||i),G(n,!0,!1,i.split(""),t),function(e,t,n){var i=I(e).begin,r=e.inputmask._valueGet(),o=r.indexOf(t),s=i;if(0===o&&i!==t.length)i=t.length;else{for(;null===r.match(a.escapeRegex(n)+"$");)n=n.substr(1);var l=r.indexOf(n);-1!==l&&""!==n&&i>l&&l>o&&(i=l)}O(i)||(i=S(i)),s!==i&&(I(e,i),p&&setTimeout(function(){I(e,i)},0))}(n,s,u),!0===N(x())&&e(n).trigger("complete")}t.preventDefault()}},setValueEvent:function(){this.inputmask.refreshValue=!1;var t=this,n=t.inputmask._valueGet(!0);e.isFunction(l.onBeforeMask)&&(n=l.onBeforeMask.call($,n,l)||n),n=n.split(""),G(t,!0,!1,z?n.reverse():n),H=x().join(""),(l.clearMaskOnLostFocus||l.clearIncomplete)&&t.inputmask._valueGet()===E().join("")&&t.inputmask._valueSet("")},focusEvent:function(e){var t=this,n=t.inputmask._valueGet();l.showMaskOnFocus&&(!l.showMaskOnHover||l.showMaskOnHover&&""===n)&&(t.inputmask._valueGet()!==x().join("")?T(t,x(),S(v())):!1===ee&&I(t,S(v()))),!0===l.positionCaretOnTab&&!1===ee&&""!==n&&(T(t,x(),I(t)),ne.clickEvent.apply(t,[e,!0])),H=x().join("")},mouseleaveEvent:function(){var e=this;if(ee=!1,l.clearMaskOnLostFocus&&n.activeElement!==e){var t=x().slice(),i=e.inputmask._valueGet();i!==e.getAttribute("placeholder")&&""!==i&&(-1===v()&&i===E().join("")?t=[]:R(t),T(e,t))}},clickEvent:function(t,a){function r(t){if(""!==l.radixPoint){var n=m().validPositions;if(n[t]===i||n[t].input===L(t)){if(t<S(-1))return!0;var a=e.inArray(l.radixPoint,x());if(-1!==a){for(var r in n)if(r>a&&n[r].input!==L(r))return!1;return!0}}}return!1}var o=this;setTimeout(function(){if(n.activeElement===o){var e=I(o);if(a&&(z?e.end=e.begin:e.begin=e.end),e.begin===e.end)switch(l.positionCaretOnClick){case"none":break;case"radixFocus":if(r(e.begin)){var t=x().join("").indexOf(l.radixPoint);I(o,l.numericInput?S(t):t);break}default:var s=e.begin,u=v(s,!0),c=S(u);if(c>s)I(o,O(s,!0)||O(s-1,!0)?s:S(s));else{var f=m().validPositions[u],p=y(c,f?f.match.locator:i,f),h=L(c,p.match);if(""!==h&&x()[c]!==h&&!0!==p.match.optionalQuantifier&&!0!==p.match.newBlockMarker||!O(c,!0)&&p.match.def===h){var d=S(c);(s>=d||s===c)&&(c=d)}I(o,c)}}}},0)},dblclickEvent:function(){var e=this;setTimeout(function(){I(e,0,S(v()))},0)},cutEvent:function(i){var r=this,o=e(r),s=I(r),l=i.originalEvent||i,u=t.clipboardData||l.clipboardData,c=z?x().slice(s.end,s.begin):x().slice(s.begin,s.end);u.setData("text",z?c.reverse().join(""):c.join("")),n.execCommand&&n.execCommand("copy"),K(r,a.keyCode.DELETE,s),T(r,x(),m().p,i,H!==x().join("")),r.inputmask._valueGet()===E().join("")&&o.trigger("cleared")},blurEvent:function(t){var n=e(this),a=this;if(a.inputmask){var r=a.inputmask._valueGet(),o=x().slice();""!==r&&(l.clearMaskOnLostFocus&&(-1===v()&&r===E().join("")?o=[]:R(o)),!1===N(o)&&(setTimeout(function(){n.trigger("incomplete")},0),l.clearIncomplete&&(d(),o=l.clearMaskOnLostFocus?[]:E().slice())),T(a,o,i,t)),H!==x().join("")&&(H=o.join(""),n.trigger("change"))}},mouseenterEvent:function(){var e=this;ee=!0,n.activeElement!==e&&l.showMaskOnHover&&e.inputmask._valueGet()!==x().join("")&&T(e,x())},submitEvent:function(){H!==x().join("")&&q.trigger("change"),l.clearMaskOnLostFocus&&-1===v()&&Z.inputmask._valueGet&&Z.inputmask._valueGet()===E().join("")&&Z.inputmask._valueSet(""),l.removeMaskOnSubmit&&(Z.inputmask._valueSet(Z.inputmask.unmaskedvalue(),!0),setTimeout(function(){T(Z,x())},0))},resetEvent:function(){Z.inputmask.refreshValue=!0,setTimeout(function(){q.trigger("setvalue")},0)}};a.prototype.positionColorMask=function(e,t){e.style.left=t.offsetLeft+"px"};var ie;if(r!==i)switch(r.action){case"isComplete":return Z=r.el,N(x());case"unmaskedvalue":return Z!==i&&r.value===i||(ie=r.value,ie=(e.isFunction(l.onBeforeMask)?l.onBeforeMask.call($,ie,l)||ie:ie).split(""),G(i,!1,!1,z?ie.reverse():ie),e.isFunction(l.onBeforeWrite)&&l.onBeforeWrite.call($,i,x(),0,l)),B(Z);case"mask":!function(t){te.off(t);var a=function(t,a){var r=t.getAttribute("type"),o="INPUT"===t.tagName&&-1!==e.inArray(r,a.supportsInputType)||t.isContentEditable||"TEXTAREA"===t.tagName;if(!o)if("INPUT"===t.tagName){var s=n.createElement("input");s.setAttribute("type",r),o="text"===s.type,s=null}else o="partial";return!1!==o?function(t){function r(){return this.inputmask?this.inputmask.opts.autoUnmask?this.inputmask.unmaskedvalue():-1!==v()||!0!==a.nullable?n.activeElement===this&&a.clearMaskOnLostFocus?(z?R(x().slice()).reverse():R(x().slice())).join(""):s.call(this):"":s.call(this)}function o(t){l.call(this,t),this.inputmask&&e(this).trigger("setvalue")}var s,l;if(!t.inputmask.__valueGet){if(!0!==a.noValuePatching){if(Object.getOwnPropertyDescriptor){"function"!=typeof Object.getPrototypeOf&&(Object.getPrototypeOf="object"==typeof"test".__proto__?function(e){return e.__proto__}:function(e){return e.constructor.prototype});var u=Object.getPrototypeOf?Object.getOwnPropertyDescriptor(Object.getPrototypeOf(t),"value"):i;u&&u.get&&u.set?(s=u.get,l=u.set,Object.defineProperty(t,"value",{get:r,set:o,configurable:!0})):"INPUT"!==t.tagName&&(s=function(){return this.textContent},l=function(e){this.textContent=e},Object.defineProperty(t,"value",{get:r,set:o,configurable:!0}))}else n.__lookupGetter__&&t.__lookupGetter__("value")&&(s=t.__lookupGetter__("value"),l=t.__lookupSetter__("value"),t.__defineGetter__("value",r),t.__defineSetter__("value",o));t.inputmask.__valueGet=s,t.inputmask.__valueSet=l}t.inputmask._valueGet=function(e){return z&&!0!==e?s.call(this.el).split("").reverse().join(""):s.call(this.el)},t.inputmask._valueSet=function(e,t){l.call(this.el,null===e||e===i?"":!0!==t&&z?e.split("").reverse().join(""):e)},s===i&&(s=function(){return this.value},l=function(e){this.value=e},function(t){if(e.valHooks&&(e.valHooks[t]===i||!0!==e.valHooks[t].inputmaskpatch)){var n=e.valHooks[t]&&e.valHooks[t].get?e.valHooks[t].get:function(e){return e.value},r=e.valHooks[t]&&e.valHooks[t].set?e.valHooks[t].set:function(e,t){return e.value=t,e};e.valHooks[t]={get:function(e){if(e.inputmask){if(e.inputmask.opts.autoUnmask)return e.inputmask.unmaskedvalue();var t=n(e);return-1!==v(i,i,e.inputmask.maskset.validPositions)||!0!==a.nullable?t:""}return n(e)},set:function(t,n){var i,a=e(t);return i=r(t,n),t.inputmask&&a.trigger("setvalue"),i},inputmaskpatch:!0}}}(t.type),function(t){te.on(t,"mouseenter",function(){var t=e(this);this.inputmask._valueGet()!==x().join("")&&t.trigger("setvalue")})}(t))}}(t):t.inputmask=i,o}(t,l);if(!1!==a&&(Z=t,q=e(Z),Q=Z!==i?Z.maxLength:i,-1===Q&&(Q=i),!0===l.colorMask&&V(Z),p&&(Z.hasOwnProperty("inputmode")&&(Z.inputmode=l.inputmode,Z.setAttribute("inputmode",l.inputmode)),"rtfm"===l.androidHack&&(!0!==l.colorMask&&V(Z),Z.type="password")),!0===a&&(te.on(Z,"submit",ne.submitEvent),te.on(Z,"reset",ne.resetEvent),te.on(Z,"mouseenter",ne.mouseenterEvent),te.on(Z,"blur",ne.blurEvent),te.on(Z,"focus",ne.focusEvent),te.on(Z,"mouseleave",ne.mouseleaveEvent),!0!==l.colorMask&&te.on(Z,"click",ne.clickEvent),te.on(Z,"dblclick",ne.dblclickEvent),te.on(Z,"paste",ne.pasteEvent),te.on(Z,"dragdrop",ne.pasteEvent),te.on(Z,"drop",ne.pasteEvent),te.on(Z,"cut",ne.cutEvent),te.on(Z,"complete",l.oncomplete),te.on(Z,"incomplete",l.onincomplete),te.on(Z,"cleared",l.oncleared),p||!0===l.inputEventOnly?Z.removeAttribute("maxLength"):(te.on(Z,"keydown",ne.keydownEvent),te.on(Z,"keypress",ne.keypressEvent)),te.on(Z,"compositionstart",e.noop),te.on(Z,"compositionupdate",e.noop),te.on(Z,"compositionend",e.noop),te.on(Z,"keyup",e.noop),te.on(Z,"input",ne.inputFallBackEvent),te.on(Z,"beforeinput",e.noop)),te.on(Z,"setvalue",ne.setValueEvent),H=E().join(""),""!==Z.inputmask._valueGet(!0)||!1===l.clearMaskOnLostFocus||n.activeElement===Z)){var r=e.isFunction(l.onBeforeMask)?l.onBeforeMask.call($,Z.inputmask._valueGet(!0),l)||Z.inputmask._valueGet(!0):Z.inputmask._valueGet(!0);""!==r&&G(Z,!0,!1,z?r.split("").reverse():r.split(""));var o=x().slice();H=o.join(""),!1===N(o)&&l.clearIncomplete&&d(),l.clearMaskOnLostFocus&&n.activeElement!==Z&&(-1===v()?o=[]:R(o)),T(Z,o),n.activeElement===Z&&I(Z,S(v()))}}(Z);break;case"format":return ie=(e.isFunction(l.onBeforeMask)?l.onBeforeMask.call($,r.value,l)||r.value:r.value).split(""),G(i,!0,!1,z?ie.reverse():ie),r.metadata?{value:z?x().slice().reverse().join(""):x().join(""),metadata:s.call(this,{action:"getmetadata"},o,l)}:z?x().slice().reverse().join(""):x().join("");case"isValid":r.value?(ie=r.value.split(""),G(i,!0,!0,z?ie.reverse():ie)):r.value=x().join("");for(var ae=x(),re=F(),oe=ae.length-1;oe>re&&!O(oe);oe--);return ae.splice(re,oe+1-re),N(ae)&&r.value===x().join("");case"getemptymask":return E().join("");case"remove":return Z&&Z.inputmask&&(q=e(Z),Z.inputmask._valueSet(l.autoUnmask?B(Z):Z.inputmask._valueGet(!0)),te.off(Z),Object.getOwnPropertyDescriptor&&Object.getPrototypeOf?Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Z),"value")&&Z.inputmask.__valueGet&&Object.defineProperty(Z,"value",{get:Z.inputmask.__valueGet,set:Z.inputmask.__valueSet,configurable:!0}):n.__lookupGetter__&&Z.__lookupGetter__("value")&&Z.inputmask.__valueGet&&(Z.__defineGetter__("value",Z.inputmask.__valueGet),Z.__defineSetter__("value",Z.inputmask.__valueSet)),Z.inputmask=i),Z;case"getmetadata":if(e.isArray(o.metadata)){var se=h(!0,0,!1).join("");return e.each(o.metadata,function(e,t){return t.mask===se?(se=t,!1):void 0}),se}return o.metadata}}var l=navigator.userAgent,u=/mobile/i.test(l),c=/iemobile/i.test(l),f=/iphone/i.test(l)&&!c,p=/android/i.test(l)&&!c;return a.prototype={dataAttribute:"data-inputmask",defaults:{placeholder:"_",optionalmarker:{start:"[",end:"]"},quantifiermarker:{start:"{",end:"}"},groupmarker:{start:"(",end:")"},alternatormarker:"|",escapeChar:"\\",mask:null,regex:null,oncomplete:e.noop,onincomplete:e.noop,oncleared:e.noop,repeat:0,greedy:!0,autoUnmask:!1,removeMaskOnSubmit:!1,clearMaskOnLostFocus:!0,insertMode:!0,clearIncomplete:!1,alias:null,onKeyDown:e.noop,onBeforeMask:null,onBeforePaste:function(t,n){return e.isFunction(n.onBeforeMask)?n.onBeforeMask.call(this,t,n):t},onBeforeWrite:null,onUnMask:null,showMaskOnFocus:!0,showMaskOnHover:!0,onKeyValidation:e.noop,skipOptionalPartCharacter:" ",numericInput:!1,rightAlign:!1,undoOnEscape:!0,radixPoint:"",radixPointDefinitionSymbol:i,groupSeparator:"",keepStatic:null,positionCaretOnTab:!0,tabThrough:!1,supportsInputType:["text","tel","password"],ignorables:[8,9,13,19,27,33,34,35,36,37,38,39,40,45,46,93,112,113,114,115,116,117,118,119,120,121,122,123,0,229],isComplete:null,canClearPosition:e.noop,preValidation:null,postValidation:null,staticDefinitionSymbol:i,jitMasking:!1,nullable:!0,inputEventOnly:!1,noValuePatching:!1,positionCaretOnClick:"lvp",casing:null,inputmode:"verbatim",colorMask:!1,androidHack:!1,importDataAttributes:!0},definitions:{9:{validator:"[0-9]",cardinality:1,definitionSymbol:"*"},a:{validator:"[A-Za-zА-яЁёÀ-ÿµ]",cardinality:1,definitionSymbol:"*"},"*":{validator:"[0-9A-Za-zА-яЁёÀ-ÿµ]",cardinality:1}},aliases:{},masksCache:{},mask:function(l){function u(n,a,o,s){function l(e,a){null!==(a=a!==i?a:n.getAttribute(s+"-"+e))&&("string"==typeof a&&(0===e.indexOf("on")?a=t[a]:"false"===a?a=!1:"true"===a&&(a=!0)),o[e]=a)}if(!0===a.importDataAttributes){var u,c,f,p,h=n.getAttribute(s);if(h&&""!==h&&(h=h.replace(new RegExp("'","g"),'"'),c=JSON.parse("{"+h+"}")),c){f=i;for(p in c)if("alias"===p.toLowerCase()){f=c[p];break}}l("alias",f),o.alias&&r(o.alias,o,a);for(u in a){if(c){f=i;for(p in c)if(p.toLowerCase()===u.toLowerCase()){f=c[p];break}}l(u,f)}}return e.extend(!0,a,o),("rtl"===n.dir||a.rightAlign)&&(n.style.textAlign="right"),("rtl"===n.dir||a.numericInput)&&(n.dir="ltr",n.removeAttribute("dir"),a.isRTL=!0),a}var c=this;return"string"==typeof l&&(l=n.getElementById(l)||n.querySelectorAll(l)),l=l.nodeName?[l]:l,e.each(l,function(t,n){var r=e.extend(!0,{},c.opts);u(n,r,e.extend(!0,{},c.userOptions),c.dataAttribute);var l=o(r,c.noMasksCache);l!==i&&(n.inputmask!==i&&n.inputmask.remove(),n.inputmask=new a(i,i,!0),n.inputmask.opts=r,n.inputmask.noMasksCache=c.noMasksCache,n.inputmask.userOptions=e.extend(!0,{},c.userOptions),n.inputmask.isRTL=r.isRTL||r.numericInput,n.inputmask.el=n,n.inputmask.maskset=l,e.data(n,"_inputmask_opts",r),s.call(n.inputmask,{action:"mask"}))}),l&&l[0]?l[0].inputmask||this:this},option:function(t,n){return"string"==typeof t?this.opts[t]:"object"==typeof t?(e.extend(this.userOptions,t),this.el&&!0!==n&&this.mask(this.el),this):void 0},unmaskedvalue:function(e){return this.maskset=this.maskset||o(this.opts,this.noMasksCache),s.call(this,{action:"unmaskedvalue",value:e})},remove:function(){return s.call(this,{action:"remove"})},getemptymask:function(){return this.maskset=this.maskset||o(this.opts,this.noMasksCache),s.call(this,{action:"getemptymask"})},hasMaskedValue:function(){return!this.opts.autoUnmask},isComplete:function(){return this.maskset=this.maskset||o(this.opts,this.noMasksCache),s.call(this,{action:"isComplete"})},getmetadata:function(){return this.maskset=this.maskset||o(this.opts,this.noMasksCache),s.call(this,{action:"getmetadata"})},isValid:function(e){return this.maskset=this.maskset||o(this.opts,this.noMasksCache),s.call(this,{action:"isValid",value:e})},format:function(e,t){return this.maskset=this.maskset||o(this.opts,this.noMasksCache),s.call(this,{action:"format",value:e,metadata:t})},analyseMask:function(t,n,r){function o(e,t,n,i){this.matches=[],this.openGroup=e||!1,this.alternatorGroup=!1,this.isGroup=e||!1,this.isOptional=t||!1,this.isQuantifier=n||!1,this.isAlternator=i||!1,this.quantifier={min:1,max:1}}function s(t,o,s){s=s!==i?s:t.matches.length;var l=t.matches[s-1];if(n)0===o.indexOf("[")||b||"."===o?t.matches.splice(s++,0,{fn:new RegExp(o,r.casing?"i":""),cardinality:1,optionality:t.isOptional,newBlockMarker:l===i||l.def!==o,casing:null,def:o,placeholder:i,nativeDef:o}):e.each(o.split(""),function(e,n){l=t.matches[s-1],t.matches.splice(s++,0,{fn:null,cardinality:0,optionality:t.isOptional,newBlockMarker:l===i||l.def!==n&&null!==l.fn,casing:null,def:r.staticDefinitionSymbol||n,placeholder:r.staticDefinitionSymbol!==i?n:i,nativeDef:n})}),b=!1;else{var u=(r.definitions?r.definitions[o]:i)||a.prototype.definitions[o];if(u&&!b){for(var c=u.prevalidator,f=c?c.length:0,p=1;p<u.cardinality;p++){var h=f>=p?c[p-1]:[],m=h.validator,d=h.cardinality;t.matches.splice(s++,0,{fn:m?"string"==typeof m?new RegExp(m,r.casing?"i":""):new function(){this.test=m}:new RegExp("."),cardinality:d||1,optionality:t.isOptional,newBlockMarker:l===i||l.def!==(u.definitionSymbol||o),casing:u.casing,def:u.definitionSymbol||o,placeholder:u.placeholder,nativeDef:o}),l=t.matches[s-1]}t.matches.splice(s++,0,{fn:u.validator?"string"==typeof u.validator?new RegExp(u.validator,r.casing?"i":""):new function(){this.test=u.validator}:new RegExp("."),cardinality:u.cardinality,optionality:t.isOptional,newBlockMarker:l===i||l.def!==(u.definitionSymbol||o),casing:u.casing,def:u.definitionSymbol||o,placeholder:u.placeholder,nativeDef:o})}else t.matches.splice(s++,0,{fn:null,cardinality:0,optionality:t.isOptional,newBlockMarker:l===i||l.def!==o&&null!==l.fn,casing:null,def:r.staticDefinitionSymbol||o,placeholder:r.staticDefinitionSymbol!==i?o:i,nativeDef:o}),b=!1}}function l(t){t&&t.matches&&e.each(t.matches,function(e,a){var o=t.matches[e+1];(o===i||o.matches===i||!1===o.isQuantifier)&&a&&a.isGroup&&(a.isGroup=!1,n||(s(a,r.groupmarker.start,0),!0!==a.openGroup&&s(a,r.groupmarker.end))),l(a)})}function u(){if(C.length>0){if(m=C[C.length-1],s(m,p),m.isAlternator){d=C.pop();for(var e=0;e<d.matches.length;e++)d.matches[e].isGroup=!1;C.length>0?(m=C[C.length-1],m.matches.push(d)):P.matches.push(d)}}else s(P,p)}function c(e){e.matches=e.matches.reverse();for(var t in e.matches)if(e.matches.hasOwnProperty(t)){var n=parseInt(t);if(e.matches[t].isQuantifier&&e.matches[n+1]&&e.matches[n+1].isGroup){var a=e.matches[t];e.matches.splice(t,1),e.matches.splice(n+1,0,a)}e.matches[t]=e.matches[t].matches!==i?c(e.matches[t]):function(e){return e===r.optionalmarker.start?e=r.optionalmarker.end:e===r.optionalmarker.end?e=r.optionalmarker.start:e===r.groupmarker.start?e=r.groupmarker.end:e===r.groupmarker.end&&(e=r.groupmarker.start),e}(e.matches[t])}return e}var f,p,h,m,d,v,k,g=/(?:[?*+]|\{[0-9\+\*]+(?:,[0-9\+\*]*)?\})|[^.?*+^${[]()|\\]+|./g,y=/\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g,b=!1,P=new o,C=[],E=[];for(n&&(r.optionalmarker.start=i,r.optionalmarker.end=i);f=n?y.exec(t):g.exec(t);){if(p=f[0],n&&!0!==b)switch(p.charAt(0)){case"?":p="{0,1}";break;case"+":case"*":p="{"+p+"}"}if(b)u();else switch(p.charAt(0)){case r.escapeChar:b=!0,n&&u();break;case r.optionalmarker.end:case r.groupmarker.end:if(h=C.pop(),h.openGroup=!1,h!==i)if(C.length>0){if(m=C[C.length-1],m.matches.push(h),m.isAlternator){d=C.pop();for(var x=0;x<d.matches.length;x++)d.matches[x].isGroup=!1,d.matches[x].alternatorGroup=!1;C.length>0?(m=C[C.length-1],m.matches.push(d)):P.matches.push(d)}}else P.matches.push(h);else u();break;case r.optionalmarker.start:C.push(new o(!1,!0));break;case r.groupmarker.start:C.push(new o(!0));break;case r.quantifiermarker.start:var A=new o(!1,!1,!0);p=p.replace(/[{}]/g,"");var _=p.split(","),w=isNaN(_[0])?_[0]:parseInt(_[0]),M=1===_.length?w:isNaN(_[1])?_[1]:parseInt(_[1]);if("*"!==M&&"+"!==M||(w="*"===M?0:1),A.quantifier={min:w,max:M},C.length>0){var O=C[C.length-1].matches;f=O.pop(),f.isGroup||(k=new o(!0),k.matches.push(f),f=k),O.push(f),O.push(A)}else f=P.matches.pop(),f.isGroup||(n&&null===f.fn&&"."===f.def&&(f.fn=new RegExp(f.def,r.casing?"i":"")),k=new o(!0),k.matches.push(f),f=k),P.matches.push(f),P.matches.push(A);break;case r.alternatormarker:if(C.length>0){m=C[C.length-1];var S=m.matches[m.matches.length-1];v=m.openGroup&&(S.matches===i||!1===S.isGroup&&!1===S.isAlternator)?C.pop():m.matches.pop()}else v=P.matches.pop();if(v.isAlternator)C.push(v);else if(v.alternatorGroup?(d=C.pop(),v.alternatorGroup=!1):d=new o(!1,!1,!1,!0),d.matches.push(v),C.push(d),v.openGroup){v.openGroup=!1;var j=new o(!0);j.alternatorGroup=!0,C.push(j)}break;default:u()}}for(;C.length>0;)h=C.pop(),P.matches.push(h);return P.matches.length>0&&(l(P),E.push(P)),(r.numericInput||r.isRTL)&&c(E[0]),E}},a.extendDefaults=function(t){e.extend(!0,a.prototype.defaults,t)},a.extendDefinitions=function(t){e.extend(!0,a.prototype.definitions,t)},a.extendAliases=function(t){e.extend(!0,a.prototype.aliases,t)},a.format=function(e,t,n){return a(t).format(e,n)},a.unmask=function(e,t){return a(t).unmaskedvalue(e)},a.isValid=function(e,t){return a(t).isValid(e)},a.remove=function(t){e.each(t,function(e,t){t.inputmask&&t.inputmask.remove()})},a.escapeRegex=function(e){var t=["/",".","*","+","?","|","(",")","[","]","{","}","\\","$","^"];return e.replace(new RegExp("(\\"+t.join("|\\")+")","gim"),"\\$1")},a.keyCode={ALT:18,BACKSPACE:8,BACKSPACE_SAFARI:127,CAPS_LOCK:20,COMMA:188,COMMAND:91,COMMAND_LEFT:91,COMMAND_RIGHT:93,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,MENU:93,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38,WINDOWS:91,X:88},a}),!function(e){"function"==typeof define&&define.amd?define(["jquery","./inputmask"],e):"object"==typeof exports?module.exports=e(require("jquery"),require("./inputmask")):e(jQuery,window.Inputmask)}(function(e,t){return void 0===e.fn.inputmask&&(e.fn.inputmask=function(n,i){var a,r=this[0];if(void 0===i&&(i={}),"string"==typeof n)switch(n){case"unmaskedvalue":return r&&r.inputmask?r.inputmask.unmaskedvalue():e(r).val();case"remove":return this.each(function(){this.inputmask&&this.inputmask.remove()});case"getemptymask":return r&&r.inputmask?r.inputmask.getemptymask():"";case"hasMaskedValue":return!(!r||!r.inputmask)&&r.inputmask.hasMaskedValue();case"isComplete":return!r||!r.inputmask||r.inputmask.isComplete();case"getmetadata":return r&&r.inputmask?r.inputmask.getmetadata():void 0;case"setvalue":e(r).val(i),r&&void 0===r.inputmask&&e(r).triggerHandler("setvalue");break;case"option":if("string"!=typeof i)return this.each(function(){return void 0!==this.inputmask?this.inputmask.option(i):void 0});if(r&&void 0!==r.inputmask)return r.inputmask.option(i);break;default:return i.alias=n,a=new t(i),this.each(function(){a.mask(this)})}else{if("object"==typeof n)return a=new t(n),this.each(void 0===n.mask&&void 0===n.alias?function(){return void 0!==this.inputmask?this.inputmask.option(n):void a.mask(this)}:function(){a.mask(this)});if(void 0===n)return this.each(function(){a=new t(i),a.mask(this)})}}),e.fn.inputmask}),!function(e){"function"==typeof define&&define.amd?define(["./dependencyLibs/inputmask.dependencyLib","./inputmask"],e):"object"==typeof exports?module.exports=e(require("./dependencyLibs/inputmask.dependencyLib"),require("./inputmask")):e(window.dependencyLib||jQuery,window.Inputmask)}(function(e,t){function n(e,t){var n=(e.mask||e).replace(/#/g,"9").replace(/\)/,"9").replace(/[+()#-]/g,""),i=(t.mask||t).replace(/#/g,"9").replace(/\)/,"9").replace(/[+()#-]/g,""),a=(e.mask||e).split("#")[0],r=(t.mask||t).split("#")[0];return 0===r.indexOf(a)?-1:0===a.indexOf(r)?1:n.localeCompare(i)}var i=t.prototype.analyseMask;return t.prototype.analyseMask=function(t,n,a){function r(e,n,i){n=n||"",i=i||s,""!==n&&(i[n]={});for(var a="",o=i[n]||i,l=e.length-1;l>=0;l--)t=e[l].mask||e[l],a=t.substr(0,1),o[a]=o[a]||[],o[a].unshift(t.substr(1)),e.splice(l,1);for(var u in o)o[u].length>500&&r(o[u].slice(),u,o)}function o(t){var n="",i=[];for(var r in t)i.push(e.isArray(t[r])?1===t[r].length?r+t[r]:r+a.groupmarker.start+t[r].join(a.groupmarker.end+a.alternatormarker+a.groupmarker.start)+a.groupmarker.end:r+o(t[r]));return n+=1===i.length?i[0]:a.groupmarker.start+i.join(a.groupmarker.end+a.alternatormarker+a.groupmarker.start)+a.groupmarker.end}var s={};return a.phoneCodes&&(a.phoneCodes&&a.phoneCodes.length>1e3&&(t=t.substr(1,t.length-2),r(t.split(a.groupmarker.end+a.alternatormarker+a.groupmarker.start)),t=o(s)),t=t.replace(/9/g,"\\9")),i.call(this,t,n,a)},t.extendAliases({abstractphone:{groupmarker:{start:"<",end:">"},countrycode:"",phoneCodes:[],mask:function(e){return e.definitions={"#":t.prototype.definitions[9]},e.phoneCodes.sort(n)},keepStatic:!0,onBeforeMask:function(e,t){var n=e.replace(/^0{1,2}/,"").replace(/[\s]/g,"");return(n.indexOf(t.countrycode)>1||-1===n.indexOf(t.countrycode))&&(n="+"+t.countrycode+n),n},onUnMask:function(e){return e.replace(/[()#-]/g,"")},inputmode:"tel"}}),t});
//# sourceMappingURL=jquery.inputmask.min.js.map
!function(i){"function"==typeof define&&define.amd?define(["./dependencyLibs/inputmask.dependencyLib","./inputmask"],i):"object"==typeof exports?module.exports=i(require("./dependencyLibs/inputmask.dependencyLib"),require("./inputmask")):i(window.dependencyLib||jQuery,window.Inputmask)}(function(i,n){return n.extendDefinitions({A:{validator:"[A-Za-zА-яЁёÀ-ÿµ]",cardinality:1,casing:"upper"},"#":{validator:"[0-9A-Za-zА-яЁёÀ-ÿµ]",cardinality:1,casing:"upper"},U:{validator:"[А-Яа-яҐґЁёІіЄєЫыЇї'`‘\\-]",cardinality:1}}),n.extendAliases({url:{definitions:{i:{validator:".",cardinality:1}},mask:"(\\http://)|(\\http\\s://)|(ftp://)|(ftp\\s://)i{+}",insertMode:!1,autoUnmask:!1,inputmode:"url"},ip:{mask:"i[i[i]].i[i[i]].i[i[i]].i[i[i]]",definitions:{i:{validator:function(i,n,e){return e-1>-1&&"."!==n.buffer[e-1]?(i=n.buffer[e-1]+i,i=e-2>-1&&"."!==n.buffer[e-2]?n.buffer[e-2]+i:"0"+i):i="00"+i,new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(i)},cardinality:1}},onUnMask:function(i){return i},inputmode:"numeric"},email:{mask:"*{1,64}[.*{1,64}][.*{1,64}][.*{1,63}]@-{1,63}.-{1,63}[.-{1,63}][.-{1,63}]",greedy:!1,onBeforePaste:function(i){return i=i.toLowerCase(),i.replace("mailto:","")},definitions:{"*":{validator:"[0-9A-Za-z!#$%&'*+/=?^_`{|}~-]",cardinality:1,casing:"lower"},"-":{validator:"[0-9A-Za-z-]",cardinality:1,casing:"lower"}},onUnMask:function(i){return i},inputmode:"email"},mac:{mask:"##:##:##:##:##:##"},vin:{mask:"V{13}9{4}",definitions:{V:{validator:"[A-HJ-NPR-Za-hj-npr-z\\d]",cardinality:1,casing:"upper"}},clearIncomplete:!0,autoUnmask:!0}}),n});
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
          onChange: function(date, text, mode) {
            return _this.$scope.$storage.strgData.bday = text;
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
    var alternatCodePhone, alternatCodePhoneMask, code, param;
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
    $('input[name="phone"]').inputmask({
      alias: "abstractphone",
      countrycode: "38",
      phoneCodes: alternatCodePhoneMask,
      showMaskOnHover: false,
      oncomplete: (function(_this) {
        return function(e) {
          return _this.$scope.$storage.strgData.phone = e.target.value;
        };
      })(this)
    });
    param = {
      mask: "(09|19|29|30|31).(09|10|11|12).9999",
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
      fireOnInit: true,
      onChecked: (function(_this) {
        return function() {
          _this.$scope.$storage.strgData.noinn = true;
          return _this.chngMsg("remove");
        };
      })(this),
      onUnchecked: (function(_this) {
        return function() {
          _this.$scope.$storage.strgData.noinn = false;
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
      mask: "U{1,128}",
      greedy: false,
      showMaskOnHover: false,
      oncomplete: (function(_this) {
        return function(e) {
          return _this.$scope.$storage.strgData.city = e.target.value;
        };
      })(this)
    };
    $('input[name="city"], .ui.dropdown input.search').inputmask(param);
    param = {
      mask: "9999999999",
      greedy: false,
      showMaskOnHover: false,
      oncomplete: (function(_this) {
        return function(e) {
          return _this.$scope.$storage.strgData.inn = e.target.value;
        };
      })(this),
      onKeyDown: (function(_this) {
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
    _form = $(this.$element).find(".ui.form");
    _checkbox = this.$iElement.find(".ui.button.submit");
    if (comm === "add") {
      _form.form("add rule", "inn", {
        rules: [
          {
            type: "integer[10...10]",
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
          if (_this.currentStep === 1) {
            _this.init();
          }
          if (_currentNameStep === "request") {
            $("html, body").animate({
              scrollTop: 0
            }, 600);
          }
          if (_currentNameStep === "request") {
            $('input[name="email"]').inputmask({
              alias: "email",
              showMaskOnHover: false,
              oncomplete: function(e) {
                return _this.$scope.emailSubscr = e.target.value;
              }
            });
            return _this.$scope.main.loading = false;
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
    if (((ref = _inEmail.inputmask) != null ? ref.isValid() : void 0) && ((ref1 = _inEmail.inputmask) != null ? ref1.isComplete() : void 0)) {
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
