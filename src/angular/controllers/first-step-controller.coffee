class firstStepController
  constructor: (@$http, @$scope, @$rootScope, @$sce, @$location, @$element, @$sceDelegate, @$filter, @$timeout) ->
    @data =
      aims: {ds:"sdls;dl"}

    @val_range =
      min: 200
      max: 50000

    @$scope.$watch (newValue, oldValue, scope) =>
      @$scope.main.currentStep
    , (newValue, oldValue, scope) =>
      @$iElement = $ @$element
      newValue = parseInt newValue
      @init() if newValue is 1
      return false

    # window["_loccc"] = @$location
    # $ () =>
    #   @$iElement = $ @$element
    #   @init()
    #   $(@$element).find "select"
    #     .dropdown()
    # @init()



  card_hover: ($event, card) ->
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
    # ng-selected="$storage.strgData.aims==key"
    _dropdown = @$iElement.find ".ui.dropdown"
      .dropdown
        onChange: (value, text, $selectedItem) =>
          @$scope.$storage.strgData.aims = value

    if @$scope.$storage.strgData.aims
      @$timeout =>
        _dropdown.data "module-dropdown"
          .set.selected @$scope.$storage.strgData.aims
      # .set.value @$scope.$storage.strgData.aims


    @changeAmount = (v) =>
      @$timeout =>
        @$scope.$storage.strgData.amount = v
        _el = @$iElement.find("[name='amount']")
        _el = angular.element _el if _el.length
        # console.log "onMove", v, meta
        _el.val? v
        _el.triggerHandler? "change"
    @$iElement.find ".ui.range"
      .range
        min: @val_range.min
        max: @val_range.max
        start: @$scope.$storage.strgData.amount
        step: 100
        smooth: on
        name         : 'AmountRange',
        namespace    : 'amountrange',
        onChange: (v, meta) => @changeAmount v
        onMove  : (v, meta) => @changeAmount v


    $(@$element).find "form"
      .form
        inline : true
        on: "blur"
        fields:
          aims:
            identifier: "aims"
            rules: [
              type: "empty"
              prompt: "Выберите цель кредита"
            ]
          amount:
            identifier: "amount"
            rules: [
              type: "integer[200..50000]"
              prompt: "Сумма кредита должна быть от 200 до 50 000 грн."
            ]
        onSuccess: (e, f) =>
          @$scope.main.loading = on
          @$location.path "/s2"
          # @$scope.main.currentStep = 2
          return false

    @$scope.main.loading = off

  init: ->
    # delete @$http.defaults.headers.common['X-Requested-With']
    params =
      data: "aims"
    trustedUrl = @$sceDelegate.trustAs @$sce.RESOURCE_URL, "#{@$rootScope.settings.api.url}#{@$rootScope.settings.api.command.get}"
    @$http.jsonp trustedUrl,
      params: params
    .then (responce) =>
      data = responce.data
      if data.result is 'success' and data.listId is 'aims'
        @data.aims = data.data
      @update()
    , (data, status, headers, config) => @update()