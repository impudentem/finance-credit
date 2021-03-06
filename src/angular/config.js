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
