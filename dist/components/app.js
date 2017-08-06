// Generated by CoffeeScript 1.12.5
var financeAppController;

financeAppController = (function() {
  function financeAppController($rootScope, $scope, $localStorage, $location, $window) {
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$location = $location;
    this.$window = $window;
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
        return console.log(_this.$location.path(), _this.currentStep, _currentNameStep);
      };
    })(this));
    $(function() {
      $(".ui.clients .ui.images").slick({
        infinite: true,
        centerMode: true,
        autoplay: true,
        accessibility: false,
        arrows: false,
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
    });
  }

  financeAppController.prototype.titleStep = function() {
    return "Шаг " + this.currentStep + " из " + this.maxStep;
  };

  financeAppController.prototype.sendEvent = function(evnt) {
    console.log(evnt);
    evnt = Object.get(this.$rootScope.settings.events, evnt);
    return this.$window.dispatchEvent(evnt);
  };

  return financeAppController;

})();
