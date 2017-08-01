angular.module 'financeApp', ['finance-directives', 'ngRoute', 'ngSanitize', 'ngStorage']
.config [
  "$sceDelegateProvider",
  "$routeProvider",
  "$locationProvider",
  ($sceDelegateProvider, $routeProvider, $locationProvider) ->
    # $routeProvider
    # .when "/", controller: financeAppController
    # .when "/s2", controller: financeAppController
    # .when "/s3", controller: financeAppController

    # $httpProvider.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8'
    # $httpProvider.defaults.headers.get['Content-Type'] = 'application/json;charset=utf-8'

    # $httpProvider.defaults.useXDomain = true
    # $httpProvider.defaults.withCredentials = true
    # delete $httpProvider.defaults.headers.common["X-Requested-With"]
    # $httpProvider.defaults.headers.common["Accept"] = "application/json"
    # $httpProvider.defaults.headers.common["Content-Type"] = "application/json; charset=UTF-8"

    $sceDelegateProvider.resourceUrlWhitelist ["self", "http://credits*.finance.ua/api/**"]
    # console.log
    $locationProvider.html5Mode on
  ]
.run [
  "$rootScope",
  "$http",
  ($rootScope, $http) ->
    $http.defaults.useXDomain = true
    # $http.defaults.withCredentials = true
    $http.defaults.headers.common["Accept"] = "application/json"
    $http.defaults.headers.common["Content-Type"] = "application/json; charset=UTF-8"
    $http.defaults.headers.common['Access-Control-Allow-Origin'] = '*'
    paramsEvent =
      detail:
        time: new Date()
      bubbles: on
      cancelable: on
    $rootScope.settings =
      apiUrl: "http://credits.finance.ua/api/list"
      stateApp:
        state1: "s1"
        state1: "s2"
        state1: "s3"
        request: "request"
      events:
        eventWidgetStep1: new CustomEvent "eventWidgetStep2", paramsEvent
        eventWidgetStep2: new CustomEvent "eventWidgetStep2", paramsEvent
        eventWidgetStep3: new CustomEvent "eventWidgetStep3", paramsEvent
        eventWidgetSuccess: new CustomEvent "eventWidgetSuccess", paramsEvent
        eventWidgetError: new CustomEvent "eventWidgetError", paramsEvent
  ]

.controller "financeAppController", ['$http', '$scope', '$sessionStorage', '$location', financeAppController]


angular.element window
  .on 'eventWidgetStep2', (e) ->
    console.log e


$ window
  .on 'eventWidgetStep2', (e) ->
    console.log "Jquery", e

window.addEventListener 'eventWidgetStep2', (e) ->
    console.log "Native", e