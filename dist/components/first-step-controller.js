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

  firstStepController.prototype.chgAmount = function(v, fromRange) {
    if (fromRange) {
      return this.$timeout((function(_this) {
        return function() {
          var _el;
          _el = _this.$iElement.find("[name='amount']");
          if (_el.length) {
            _el = angular.element(_el);
          }
          if (typeof _el.val === "function") {
            _el.val(v);
          }
          return typeof _el.triggerHandler === "function" ? _el.triggerHandler("change") : void 0;
        };
      })(this));
    } else {
      return this.rangeElement.data("module-amountrange").set.value(v);
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
      })(this)
    });
    $(this.$element).find("form").form({
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
      },
      onSuccess: (function(_this) {
        return function(e, f) {
          _this.$scope.main.loading = true;
          _this.$location.path("/s2");
          return false;
        };
      })(this)
    });
    return this.$scope.main.loading = false;
  };

  firstStepController.prototype.init = function() {
    var params, trustedUrl;
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
