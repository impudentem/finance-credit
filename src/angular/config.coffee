angular.module 'financeApp', ['finance-directives', 'ngRoute', 'ngSanitize', 'ngStorage']
.config [
  "$sceDelegateProvider",
  "$localStorageProvider",
  "$locationProvider",
  ($sceDelegateProvider, $localStorageProvider, $locationProvider) ->
    $sceDelegateProvider.resourceUrlWhitelist ["self", "http://credits*.finance.ua/api/**"]
    $locationProvider.html5Mode on
    $localStorageProvider.setKeyPrefix "financeStorage-"
    strgTime = $localStorageProvider.get "strgTime"
    strgData = $localStorageProvider.get "strgData"
    loclTime = new Date()
    if strgTime
      _d = new Date strgTime?.time
      if loclTime.getTime() > _d.getTime()
        $localStorageProvider.remove "strgData"
        _d = loclTime.getDateAdd loclTime, "day", 1
          .toISOString()
    else
      _d = loclTime.getDateAdd loclTime, "day", 1
        .toISOString()
      $localStorageProvider.remove "strgData" if strgData
    $localStorageProvider.set "strgTime", time: _d
  ]
.run [
  "$rootScope",
  "$http",
  "$location",
  ($rootScope, $http, $location) ->
    $location.path "/s1"

    $http.defaults.useXDomain = true
    $http.defaults.headers.common["Accept"] = "application/json"
    $http.defaults.headers.common["Content-Type"] = "application/json; charset=UTF-8"
    $http.defaults.headers.common['Access-Control-Allow-Origin'] = '*'

    $rootScope.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile/i.test navigator.userAgent

    paramsEvent =
      detail:
        time: new Date()
      bubbles: on
      cancelable: on
    $rootScope.settings =
      api:
        debug : on
        url   : "//credits.finance.ua/api/"
        command:
          get: "list"
          put: "submit"
      events:
        s1: new CustomEvent "eventWidgetStep1", paramsEvent
        s2: new CustomEvent "eventWidgetStep2", paramsEvent
        s3: new CustomEvent "eventWidgetStep3", paramsEvent
        request:
          success: new CustomEvent "eventWidgetSuccess", paramsEvent
          error: new CustomEvent "eventWidgetError", paramsEvent
        transitionEvent: ->
          element      = document.createElement "element"
          transitions  =
            transition       : "transitionend"
            OTransition      : "oTransitionEnd"
            MozTransition    : "transitionend"
            WebkitTransition : "webkitTransitionEnd"
          for k, v of transitions
            return transition = v if  element.style[k] isnt undefined
          return transition


    $ document
      .ready ->
        $ "#page-preloader"
          .addClass "loaded"
          .on $rootScope.settings.events.transitionEvent(), (e) ->
            $ e.currentTarget
              .remove()

  ]

.controller "financeAppController", ['$rootScope', '$scope', '$localStorage', '$location', '$window', '$timeout', '$route', financeAppController]