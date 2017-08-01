class twoStepController
  constructor: (@$http, @$scope, @$rootScope, @$sce, @$window, @$element, @$sceDelegate, @$filter, @$timeout) ->
    @form_data = {}

    @$scope.$watch (newValue, oldValue, scope) =>
      @$scope.main.currentStep
    , (newValue, oldValue, scope) =>
      @init() if newValue is 2
      return false

  card_hover: ($event, card) ->
    @$scope.cards_two.card_hover = if $event.type is "mouseover" then card else ""
    # @$scope.$apply() if not @$scope.$$phase

  init: ->
    minDate = new Date()
    maxDate = new Date()
    maxDate.setFullYear maxDate.getFullYear() - 18
    minDate.setFullYear minDate.getFullYear() - 90
    @initCal = () =>
      _cal = $ ".ui.calendar"
      if _cal.length
        _cal.calendar
          type: "date"
          firstDayOfWeek: 1
          ampm: off
          minDate: minDate
          maxDate: maxDate
          disableMinute: on
          className:
            prevIcon: "open icon left"
            nextIcon: "open icon right"
          text:
            days: ['В', 'П', 'В', 'С', 'Ч', 'П', 'С']
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            today: 'Сегодня'
            now: 'Сейчас'
            am: 'AM'
            pm: 'PM'
          onChange: (date, text, mode) =>
            @$scope.form_two.form_data.bday = text
            @$scope.$apply() if not @$scope.$$phase
          formatter:
            date: (date, settings) ->
              return "" if not date
              return date.toLocaleString().split(',')[0]
        @$scope.form_two.form_data.calObj = _cal
        window.__calend = _cal
        @$scope.main.loading = off
        @initMask()
      else
        @$timeout () =>
          @initCal()
        , 1000

    @$timeout () =>
      @initCal()

  initMask: ->
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

    @$window.dispatchEvent @$rootScope.settings.events.eventWidgetStep2

    $(@$element).find "form"
      .form
        inline : true
        on: "blur"
        fields:
          fullname:
            identifier: "fullname"
            rules: [
              type: "regExp[/^[а-яёієыї\\-\\']*\\s[а-яёієыї\\-\\']*\\s[а-яёієыї\\-\\']*$/i]"
              prompt: "Введены недопустимые символы"
            ]
          fullname:
            identifier: "fullname"
            rules: [
              type: "regExp[/^[а-яёієыї\\-\\']*\\s[а-яёієыї\\-\\']*\\s[а-яёієыї\\-\\']*$/i]"
              prompt: "Введены недопустимые символы"
            ]
          phone:
            identifier: "phone"
            rules: [
              # type: "contain['(039)','(050)','(063)','(066)','(067)','(068)','(073)','(091)','(092)','(093)','(094)','(095)','(096)','(097)','(098)','(099)']"
              type: "empty"
              prompt: "Неправильный номер телефона"
            ]
          aggree:
            identifier: "aggree"
            rules: [
              type: "checked"
              prompt: "Так мы не сможем обработать Ваш запрос"
            ]
        onSuccess: (e, f) =>
          # e.defaultPrevented()
          @$scope.main.loading = on
          @$scope.main.currentStep = 3
          console.log e, f
          return false


