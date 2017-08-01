class firstStepController
  constructor: (@$http, @$scope, @$rootScope, @$sce, @$window, @$element, @$sceDelegate, @$filter, @$timeout) ->
    @$scope.amount = 0

    @$scope.defAims =
      21: "Деньги до зарплаты"
      22: "Деньги после зарплаты"
      23: "Деньги до и после зарплаты"

    @val_range =
      min: 200
      max: 50000
    $ () =>
      @$iElement = $ @$element
      @init()
      # $(@$element).find "select"
      #   .dropdown()
    # @init()

  card_hover: ($event, card) ->
    # console.log @$scope
    @$scope.cards_first.card_hover = if $event.type is "mouseover" then card else ""
    # @$scope.$apply() if not @$scope.$$phase

  chgAmount: (v, fromRange) ->
    if fromRange
      @$timeout =>
        _el = @$iElement.find("[name='amount']")
        _el = angular.element _el if _el.length
        # console.log "onMove", v, meta
        _el.val? v
        _el.triggerHandler? "change"
    else
      @rangeElement.data "module-amountrange"
        .set.value v

  update: ->

    @$iElement.find ".ui.dropdown"
      .dropdown()
    @rangeElement = @$iElement.find ".ui.range"
      .range
        min: @val_range.min
        max: @val_range.max
        start: 5000
        step: 100
        smooth: on
        name         : 'AmountRange',
        namespace    : 'amountrange',
        onChange: (v, meta) =>
          # @chgAmount v, on
          @$timeout =>
            _el = @$iElement.find("[name='amount']")
            _el = angular.element _el if _el.length
            # console.log "onMove", v, meta
            _el.val? v
            _el.triggerHandler? "change"

    $(@$element).find "form"
      .form
        inline : true
        on: "blur"
        fields:
          aims:
            identifier: "aims"
            rules: [
              type: "empty"
              message: "Выберите цель кредита"
            ]
          amount:
            identifier: "amount"
            rules: [
              type: "integer[200..50000]"
              prompt: "Сумма кредита должна быть от 200 до 50 000 грн."
            ]
        onSuccess: (e, f) =>
          @$scope.main.loading = on
          @$scope.main.currentStep = 2
          return false

    @$scope.main.loading = off

  init: ->

    # delete @$http.defaults.headers.common['X-Requested-With']

    params =
      data: "aims"
    trustedUrl = @$sceDelegate.trustAs @$sce.RESOURCE_URL, @$rootScope.settings.apiUrl
    @$http.jsonp trustedUrl,
      params: params
    .then (data) =>
      data = data.data
      if data.result is 'success' and data.listId is 'aims'
        @$scope.dataAims = data.data
      else
        @$scope.dataAims = @$scope.defAims
      @update()
    , (data, status, headers, config) =>

      @$scope.dataAims = @$scope.defAims
      @update()