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

  update: ->
    _dropdown_city = @$iElement.find ".ui.dropdown.city"
      .dropdown
        allowAdditions: on
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

    $(@$element).find "form"
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
        onSuccess: (e, f) =>
          @$scope.main.loading = on
          # @$location.path "/s2"
          # @$scope.main.currentStep = 2
          return false

    @chngMsg "add"

    @$scope.main.loading = off
    # @initMask()

  chngMsg: (comm) ->
    _form = $(@$element).find "form"
    _checkbox = @$iElement.find ".ui.button.submit"
    if comm is "add"
      _form.form "add rule", "inn",
        rules: [
          type: "integer[10]"
          prompt: "Неправильный ИНН"
        ]
      _checkbox.popup
        transition: "horizontal flip"
        position  : 'right center',
        target    : '#inn',
        content   : 'Без ИНН шансы на получение кредита значительно уменьшаются. Часть банков не будет рассматривать заявку, если отправить её без ИНН.'
    else
      _form.form "remove fields", ["inn"]
      # _form.form "remove rule", "inn",
      #   rules: [
      #     type: "integer[10]"
      #     prompt: "Неправильный ИНН"
      #   ]
      _form.form "validate field", "inn"
      _checkbox.popup "destroy"



  #   @initCal = () =>
  #     _cal = $ ".ui.calendar"
  #     if _cal.length
  #       _cal.calendar
  #         type: "date"
  #         firstDayOfWeek: 1
  #         ampm: off
  #         disableMinute: on
  #         className:
  #           prevIcon: "arrow-input icon rotated small"
  #           nextIcon: "arrow-input icon left rotated small"
  #         text:
  #           days: ['В', 'П', 'В', 'С', 'Ч', 'П', 'С']
  #           months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  #           monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  #           today: 'Сегодня'
  #           now: 'Сейчас'
  #           am: 'AM'
  #           pm: 'PM'
  #         onChange: (date, text, mode) =>
  #           @$scope.form_three.form_data.bday = text
  #           @$scope.$apply() if not @$scope.$$phase
  #         formatter:
  #           date: (date, settings) ->
  #             return "" if not date
  #             return date.toLocaleString().split(',')[0]
  #       @$scope.form_three.form_data.calObj = _cal
  #       @$scope.main.loading = off
  #       @initMask()
  #     else
  #       @$timeout () =>
  #         @initCal()
  #       , 1000

  #   @$timeout () =>
  #     @initCal()
  # $(@$element).find "form"
  #   .form
  #     inline : true
  #     on: "blur"
  #     fields:
  #       username:
  #         identifier: "user_name"
  #         rules: [
  #           type: "regExp[/^[а-яёієыї][\\w\\s\-\']*$/g]"
  #           prompt: "Введены недопустимые символы"
  #         ]
  #       phone:
  #         identifier: "phone"
  #         rules: [
  #           type: "contain['(039)','(050)','(063)','(066)','(067)','(068)','(073)','(091)','(092)','(093)','(094)','(095)','(096)','(097)','(098)','(099)']"
  #           prompt: "Неправильный номер телефона"
  #         ]
  #       aggree:
  #         identifier: "aggree"
  #         rules: [
  #           type: "checkbox"
  #           prompt: "Так мы не сможем обработать Ваш запрос"
  #         ]
  #     onSuccess: (e, f) =>
  #       # e.defaultPrevented()
  #       @$scope.main.loading = on
  #       @$scope.main.currentStep = 3
  #       console.log e, f
  #       return false

  # initMask: ->
  # $ document
  #   .ready ->
  #     console.log "READY___"
  #     return ""
  # param =
  #   mask: "+38 (\\099) 999-99-99"
  #   greedy: off
  # $ 'input[name="phone"]'
  #   .inputmask param
  # $ 'input[name="email"]'(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)
  #   .inputmask "email"039', '050', '063', '066', '067', '068', '073', '091', '092', '093', '094', '095', '096', '097', '098', '099'

  # allowCode = ['(039)','(050)','(063)','(066)','(067)','(068)','(073)','(091)','(092)','(093)','(094)','(095)','(096)','(097)','(098)','(099)']

  # @$window.dispatchEvent @$rootScope.settings.events.eventWidgetStep3

  init: (type, @fn) ->
    # delete @$http.defaults.headers.common['X-Requested-With']
    if type
      params =
        data: type
      trustedUrl = @$sceDelegate.trustAs @$sce.RESOURCE_URL, "#{@$rootScope.settings.api.url}#{@$rootScope.settings.api.command.get}"
      @$http.jsonp trustedUrl,
        params: params
      .then (responce) => @fn? responce.data
      , (responce) => @fn? responce.data

  post: (type, @fn) ->
    # delete @$http.defaults.headers.common['X-Requested-With']
    if type
      params =
        data: type
      trustedUrl = @$sceDelegate.trustAs @$sce.RESOURCE_URL, "#{@$rootScope.settings.api.url}#{@$rootScope.settings.api.command.get}"
      @$http.jsonp trustedUrl,
        params: params
      .then (responce) => @fn? responce.data
      , (responce) => @fn? responce.data

