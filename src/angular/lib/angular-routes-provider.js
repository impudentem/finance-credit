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
