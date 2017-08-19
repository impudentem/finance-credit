class twoStepController
  constructor: (@$http, @$scope, @$rootScope, @$sce, @$location, @$element, @$sceDelegate, @$filter, @$timeout) ->
    @calendar = {}

    @$scope.$watch (newValue, oldValue, scope) =>
      @$scope.main.currentStep
    , (newValue, oldValue, scope) =>
      @$iElement = $ @$element
      newValue = parseInt newValue
      @init() if newValue is 2
      # return false

  card_hover: ($event, card) ->
    @$scope.cards_two.card_hover = if $event.type is "mouseover" then card else ""
    # @$scope.$apply() if not @$scope.$$phase

  formatter: (date) ->
    return "" if not date
    day = "#{date.getDate()}"
    month = "#{date.getMonth()+1}"
    day = if day.length < 2 then "0#{date.getDate()}" else "#{date.getDate()}"
    month = if month.length < 2 then "0#{date.getMonth()+1}" else "#{date.getMonth()+1}"
    year = "#{date.getFullYear()}"
    return "#{day}.#{month}.#{year}"

  init: ->
    @calendar = {}
    @minDate = new Date()
    @maxDate = new Date()
    @maxDate.setFullYear @maxDate.getFullYear() - 18
    @minDate.setFullYear @minDate.getFullYear() - 90
    @initCal = () =>
      @calendar = @$iElement.find "button.daterange"
        .daterangepicker
          singleDatePicker: on
          # autoApply: on
          locale:
            format: "DD.MM.YYYY"
            separator: " - ",
            applyLabel: "Ок"
            cancelLabel: "Отмена"
            fromLabel: "С"
            toLabel: "По"
            customRangeLabel: "Custom"
            weekLabel: "W"
            daysOfWeek: ['В', 'П', 'В', 'С', 'Ч', 'П', 'С']
            monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
            firstDay: 1
          opens: "left"
          minDate: @formatter @minDate
          maxDate: @formatter @maxDate
          startDate: if @$scope.$storage.strgData.bday then moment(@$scope.$storage.strgData.bday, "DD.MM.YYYY").toDate() else @minDate
        , (start, end, label) =>
          # console.log start, start.toDate()
          # @bday = start.toDate()
          form = $(@$element).find ".ui.form"
          form = form.data "module-form"
          @bday = start.format "DD.MM.YYYY"
          # Date(@bday)
          @$scope.$storage.strgData.bday = start.format "DD.MM.YYYY"
          @$scope.$apply() if not @$scope.$$phase

          form.validate.form() if form and form.is.valid() isnt on

      @calendar_input = @$iElement.find "input[name='bday']"
        .on "change", (e) =>
          @calendar.data "daterangepicker"
            .setStartDate if @calendar_input.inputmask("isComplete") then moment(e.target.value, "DD.MM.YYYY").toDate() else @minDate
        .inputmask
          # mask: "dd.mm.yyyy"
          placeholder: "__.__.____"
          alias: "dd.mm.yyyy"
          yearrange:
            minyear: @minDate.getFullYear()
            maxyear: @maxDate.getFullYear()
          # countrycode: "38"
          # phoneCodes: alternatCodePhoneMask
          greedy: off
          # keepStatic: on insertMode
          showMaskOnHover: off
          # oncomplete: (e) => @$scope.$storage.strgData.bday = if @calendar_input.inputmask("isComplete") then e.target.value else
          # onKeyDown: (e) => @$scope.$storage.strgData.bday = e.target.value

      @calendar_input.val @$scope.$storage.strgData.bday if @$scope.$storage.strgData.bday
      # @calendar = @$iElement.find ".ui.calendar"
      #   .calendar
      #     type: "date"
      #     firstDayOfWeek: 1
      #     ampm: off
      #     minDate: minDate
      #     maxDate: maxDate
      #     initialDate: minDate
      #     touchReadonly: off
      #     disableMinute: on
      #     on: 'click'
      #     popupOptions:
      #       position: 'top right'
      #       lastResort: 'top right'
      #       # hideOnScroll: false
      #     className:
      #       prevIcon: "open icon left"
      #       nextIcon: "open icon right"
      #     text:
      #       days: ['В', 'П', 'В', 'С', 'Ч', 'П', 'С']
      #       months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
      #       monthsShort: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
      #       today: 'Сегодня'
      #       now: 'Сейчас'
      #       am: 'AM'
      #       pm: 'PM'
      #     onChange: (date, text, mode) =>
      #       # console.log date, text, mode
      #       @$scope.$storage.strgData.bday = text
      #       # @$scope.$apply() if not @$scope.$$phase
      #     formatter:
      #       date: (date, settings) ->
      #         return "" if not date
      #         day = "#{date.getDate()}"
      #         month = "#{date.getMonth()+1}"
      #         day = if day.length < 2 then "0#{date.getDate()}" else "#{date.getDate()}"
      #         month = if month.length < 2 then "0#{date.getMonth()+1}" else "#{date.getMonth()+1}"
      #         year = "#{date.getFullYear()}"
      #         return "#{day}.#{month}.#{year}"
      @initMask()

    @$timeout () =>
      @initCal()


  prevStep: ->
    @$scope.main.$location.path '/s1'
    @$scope.main.loading = on

  nextStep: ->
    form = $(@$element).find ".ui.form"
    form = form.data "module-form"
    if form and form.is.valid()
      @$scope.main.loading = on
      # @data.aims = {}
      @$location.path "/s3"
      @$scope.$apply() if not @$scope.$$phase
    else if form
      form.validate.form()

  initMask: ->
    @$scope.$storage.strgData.aggree = true if @$scope.$storage.strgData.aggree is undefined
    alternatCodePhone     = [39,50,63,66,67,68,73,91,92,93,94,95,96,97,98,99]
    alternatCodePhoneMask = ({mask: "+38 (0#{code}) ###-##-##", cc: "UA", cd: "Ukraine"} for code in alternatCodePhone)
    $ 'input[name="phone"]'
      .inputmask
        mask: "+38 \\(099\\) 999-99-99"
        # alias: "abstractphone"
        # countrycode: "38"
        # phoneCodes: alternatCodePhoneMask
        greedy: off
        # keepStatic: on
        showMaskOnHover: off
        oncomplete: (e) => @$scope.$storage.strgData.phone = e.target.value
        onKeyDown: (e) => @$scope.$storage.strgData.phone = e.target.value

    # param =
    #   mask: "(09|19|29|30|31).(09|10|11|12).9999"
    #   greedy: off
    #   showMaskOnHover: off
    #   oncomplete: (e) => @$scope.$storage.strgData.bday = e.target.value
    # $ 'input[name="bday"]'
    #   .inputmask param

    param =
      mask: "U{1,64} (U{1,64})|(U{1,64} U{1,64})"
      greedy: off
      showMaskOnHover: off
      oncomplete: (e) => @$scope.$storage.strgData.name = e.target.value
    $ 'input[name="fullname"]'
      .inputmask param

    @$scope.main.loading = off

    # $ 'input[name="email"]'(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)
    #   .inputmask "email"039', '050', '063', '066', '067', '068', '073', '091', '092', '093', '094', '095', '096', '097', '098', '099'
    # allowCode = ['(039)','(050)','(063)','(066)','(067)','(068)','(073)','(091)','(092)','(093)','(094)','(095)','(096)','(097)','(098)','(099)']@maxDate.getFullYear() - 18
    # @minDate.setFullYear @minDate.getFullYear() - 90


    $(@$element).find ".ui.form"
      .form
        inline : true
        on: "blur"
        fields:
          fullname:
            identifier: "fullname"
            rules: [
              type: "regExp[/^([а-яёієыї\\-\\']+\\s[а-яёієыї\\-\\']+)?(\\s[а-яёієыї\\-\\']+)?$/i]"
              prompt: "Введены недопустимые символы"
            ,
              type: "empty"
              prompt: "Укажите Имя и Фамилию"
            ]
          bday:
            identifier: "bday"
            rules: [
              type: "regExp[/^\\d{2}[\\.]\\d{2}[\\.]\\d{4}$/i]"
              prompt: "Неправильная дата рождения"
            ]
          phone:
            identifier: "phone"
            rules: [
              # type: "contain['(039)','(050)','(063)','(066)','(067)','(068)','(073)','(091)','(092)','(093)','(094)','(095)','(096)','(097)','(098)','(099)']"
              # type: "empty"
              type: "regExp[/^\\+38\\s\\(0\\d{2}\\)\\s\\d{3}\\-\\d{2}\\-\\d{2}$/i]"
              prompt: "Неправильный номер телефона"
            ,
              type: "empty"
              prompt: "Вы не указали номер телефона"
            ]
          aggree:
            identifier: "aggree"
            rules: [
              type: "checked"
              prompt: "Так мы не сможем обработать Ваш запрос"
            ]

