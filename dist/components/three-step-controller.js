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
