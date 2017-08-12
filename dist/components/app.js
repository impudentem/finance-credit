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
