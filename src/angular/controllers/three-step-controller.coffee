class threeStepController
  constructor: (@$http, @$scope, @$rootScope, @$sce, @$location, @$element, @$sceDelegate, @$filter, @$timeout) ->
    @data =
      cities: {}
      employments: {}

    @$scope.$watch (newValue, oldValue, scope) =>
      @$scope.main.currentStep
    , (newValue, oldValue, scope) =>
      @$iElement = $ @$element
      newValue = parseInt newValue
      if newValue is 3
        @data.employments = {}
        @data.cities = {}
        @init "cities", (responce) ->
          @data.cities = responce.data if responce and responce.result is 'success'
          @init "employments", (responce) -> @data.employments = responce.data if responce and responce.result is 'success'
      return false

    @$scope.$watch (newValue, oldValue, scope) =>
      @data
    , (newValue, oldValue, scope) =>
      @update() if Object.size(@data.cities) and Object.size(@data.employments)
    , true

  card_hover: ($event, card) ->
    @$scope.cards_three.card_hover = if $event.type is "mouseover" then card else ""
    # @$scope.$apply() if not @$scope.$$phase

  prevStep: ->
    @$scope.main.loading = on
    @data.employments = {}
    @data.cities = {}
    @$scope.main.$location.path '/s2'

  nextStep: ->
    form = $(@$element).find ".ui.form"
    form = form.data "module-form"
    if form and form.is.valid()
      @$scope.main.loading = on
      # @data.aims = {}
      # @$location.path "/s3"
      data =
        aims       : @$scope.$storage.strgData.aims
        amount     : @$scope.$storage.strgData.amount
        name       : @$scope.$storage.strgData.name
        phone      : @$scope.$storage.strgData.phone
        bday       : @$scope.$storage.strgData.bday
        employment : @$scope.$storage.strgData.employment
        city       : @$scope.$storage.strgData.city
        utime      : (new Date()).getTime()
      data.inn = @$scope.$storage.strgData.inn if not @$scope.$storage.strgData.noinn
      data.result = "#{off}" if @$rootScope.settings.api.debug is on

      @data.employments = {}
      @data.cities = {}

      @post data, (resp) =>
        @$location.path "/request"
        @$scope.main.statusReq = if resp?.result is "success" then on else off

        @$scope.$storage.$reset()
        @$scope.$apply() if not @$scope.$$phase

    else if form
      form.validate.form()

  update: ->
    _dropdown_city = @$iElement.find ".ui.dropdown.city"
      .dropdown
        selectOnKeydown: off
        allowReselection: on
        forceSelection: off
        hideAdditions: off
        allowAdditions: on
        message:
          addResult     : '<b>{term}</b>'
          noResults     : 'Ничего не найдено.'

        onChange: (value, text, $selectedItem) =>
          @$scope.$storage.strgData.city     = text
          @$scope.$storage.strgData.city_val = value
    _dropdown_employment = @$iElement.find ".ui.dropdown.employment"
      .dropdown
        onChange: (value, text, $selectedItem) => @$scope.$storage.strgData.employment = value

    _checkbox_noinn = @$iElement.find ".ui.checkbox.noinn"
      .checkbox().first().checkbox
        onChecked  : => @chngMsg "remove"
        onUnchecked: => @chngMsg "add"

    if @$scope.$storage.strgData.city_val
      @$timeout =>
        _dropdown_city.data "module-dropdown"
          .set.selected @$scope.$storage.strgData.city

    if @$scope.$storage.strgData.employment
      @$timeout =>
        _dropdown_employment.data "module-dropdown"
          .set.selected @$scope.$storage.strgData.employment

    param =
      mask: "U{1,128}"
      greedy: off
      showMaskOnHover: off
      oncomplete: (e) => @$scope.$storage.strgData.city = e.target.value
    $ 'input[name="city"], .ui.dropdown input.search'
      .inputmask param

    param =
      mask: "9999999999"
      greedy: off
      showMaskOnHover: off
      oncomplete: (e) => @$scope.$storage.strgData.inn = e.target.value
      onKeyDown: (e) =>
        console.log e
        @$scope.$storage.strgData.inn = e.target.value
    $ 'input[name="inn"]'
      .inputmask param

    $(@$element).find ".ui.form"
      .form
        inline : true
        on: "blur"
        fields:
          employment:
            identifier: "employment"
            rules: [
              type: "empty"
              prompt: "Выберите трудоустройство"
            ]
          city:
            identifier: "city"
            rules: [
              type: "empty"
              prompt: "Введите ваш город"
            ]
        # onSuccess: (e, f) =>
        #   console.log "onSuccess", e
        #   @$scope.main.loading = on

        #   data =
        #     aims       : @$scope.$storage.strgData.aims
        #     amount     : @$scope.$storage.strgData.amount
        #     name       : @$scope.$storage.strgData.name
        #     phone      : @$scope.$storage.strgData.phone
        #     bday       : @$scope.$storage.strgData.bday
        #     employment : @$scope.$storage.strgData.employment
        #     city       : @$scope.$storage.strgData.city
        #     utime      : (new Date()).getTime()
        #   data.inn = @$scope.$storage.strgData.inn if not @$scope.$storage.strgData.noinn
        #   data.result = "#{off}" if @$rootScope.settings.api.debug is on

        #   @data.employments = {}
        #   @data.cities = {}

        #   @post data, (resp) =>
        #     e.preventDefault()
        #     e.stopPropagation()

        #     console.log "postSuccess", resp

        #     @$location.path "/request"
        #     @$scope.main.statusReq = if resp?.result is "success" then on else off

        #     @$scope.$apply() if not @$scope.$$phase

        #   return off

    @chngMsg "add"

    @$scope.main.loading = off

  chngMsg: (comm) ->
    _form = $(@$element).find ".ui.form"
    _checkbox = @$iElement.find ".ui.button.submit"
    if comm is "add"
      _form.form "add rule", "inn",
        rules: [
          type: "integer[10...10]"
          prompt: "Неправильный ИНН"
        ]
      _checkbox.popup
        transition: "horizontal flip"
        position  : 'right center',
        target    : '#inn',
        content   : 'Без ИНН шансы на получение кредита значительно уменьшаются. Часть банков не будет рассматривать заявку, если отправить её без ИНН.'
    else
      _form.form "remove fields", ["inn"]
      _form.form "validate field", "inn"
      _checkbox.popup "destroy"

  # @$window.dispatchEvent @$rootScope.settings.events.eventWidgetStep3

  init: (type, @fn) ->
    if type
      params =
        data: type
      trustedUrl = @$sceDelegate.trustAs @$sce.RESOURCE_URL, "#{@$rootScope.settings.api.url}#{@$rootScope.settings.api.command.get}"
      clbck = (responce) => @fn? responce.data
      @$http.jsonp trustedUrl,
        params: params
      .then clbck, clbck

  post: (type, @fn) ->
    # delete @$http.defaults.headers.common['X-Requested-With']
    if type
      params =
        data: type
      trustedUrl = @$sceDelegate.trustAs @$sce.RESOURCE_URL, "#{@$rootScope.settings.api.url}#{@$rootScope.settings.api.command.put}"
      clbck = (responce) => @fn? responce.data
      @$http.jsonp trustedUrl,
        params: params
      .then clbck, clbck

