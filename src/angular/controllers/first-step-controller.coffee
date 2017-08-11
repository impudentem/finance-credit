class firstStepController
  constructor: (@$http, @$scope, @$rootScope, @$sce, @$location, @$element, @$sceDelegate, @$filter, @$timeout) ->
    @data =
      aims: {}

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


  card_hover: ($event, card) ->
    @$scope.cards_first.card_hover = if $event.type is "mouseover" then card else ""
    # @$scope.$apply() if not @$scope.$$phase

  selectAllTxt: ($event) ->
    $event.currentTarget.select()

  chgAmount: ($event) ->
    @$timeout =>
      @$scope.$storage.strgData.amount = @$scope.$storage.strgData.amount.replace /[^0-9]+/g, ''
      @$iElement.find ".ui.range"
        .data "module-amountrange"
          .update?.value @$scope.$storage.strgData.amount if @$scope.$storage.strgData.amount
      @$scope.$apply() if not @$scope.$$phase
    # "f32. 32".replace(/[^0-9]+/g, '');

  nextStep: ->
    form = $(@$element).find ".ui.form"
    form = form.data "module-form"
    if form and form.is.valid()
      @$scope.main.loading = on
      @data.aims = {}
      @$location.path "/s2"
      @$scope.$apply() if not @$scope.$$phase
    else if form
      form.validate.form()


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

    $(@$element).find ".ui.form"
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
        # onSuccess: (e, f) =>
        #   e.preventDefault()
        #   e.stopPropagation()

        #   console.log "fromFirst", e

        #   @$scope.main.loading = on
        #   @data.aims = {}
        #   @$location.path "/s2"
        #   @$scope.$apply() if not @$scope.$$phase

        #   return off

    @$scope.main.loading = off

  init: ->
    @data.aims = {}
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