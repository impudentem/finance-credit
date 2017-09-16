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
    @minDateMob = moment(@minDate).format("YYYY-MM-DD")
    @maxDateMob = moment(@maxDate).format("YYYY-MM-DD")
    @initCal = () =>
      @calendar = @$iElement.find "button.daterange"
        .daterangepicker
          singleDatePicker: on
          showDropdowns: on
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
          startDate: if @$scope.$storage.strgData.bday then moment(@$scope.$storage.strgData.bday, "DD.MM.YYYY").toDate() else @maxDate
        , (start, end, label) =>

          form = $(@$element).find ".ui.form"
          form = form.data "module-form"
          
          _bday = start.format "DD.MM.YYYY"

          # console.log _bday, @mob_trigger_calendar_input.val()

          @$scope.$storage.strgData.bday = _bday
          # if @$rootScope.isMobile
          @mob_trigger_calendar_input.val moment(_bday, "DD.MM.YYYY").format("YYYY-MM-DD")
          @$scope.$apply() if not @$scope.$$phase

          form.validate.form() if form and form.is.valid() isnt on

      @calendar_input = @$iElement.find "input[name='bday']"
      @mob_trigger_calendar_input = @$iElement.find "input[name='mobtriggerbday']"
      if @$rootScope.isMobile
        @mob_trigger_calendar_input.on "change", (e) =>
          _lfDate = if @isValidRange e.target.value, "YYYY-MM-DD" then moment(e.target.value, "YYYY-MM-DD").format("DD.MM.YYYY") else moment(@maxDate).format("DD.MM.YYYY")
          @$scope.$storage.strgData.bday = _lfDate
          @calendar.data "daterangepicker"
            .setStartDate moment(_lfDate, "DD.MM.YYYY").toDate?()
          @calendar.data "daterangepicker"
            .setEndDate moment(_lfDate, "DD.MM.YYYY").toDate?()
          @$scope.$apply() if not @$scope.$$phase
        # @calendar_input.attr 
        #   "min": moment(@minDate).format "YYYY-MM-DD"
        #   "max": moment(@maxDate).format "YYYY-MM-DD"
        #   "type": "date"
        # @initFormatDateFunction @calendar_input
      # else
      @calendar_input.on "change", (e) =>
        # if @$rootScope.isMobile
        #   _date = moment e.target.value
        #     .format @calendar_input.attr("data-date-format")
        #   @calendar_input.attr "data-date": _date
        @calendar.data "daterangepicker"
          .setStartDate if @calendar_input.inputmask("isComplete") then moment(e.target.value, "DD.MM.YYYY").toDate() else @maxDate
        @calendar.data "daterangepicker"
          .setEndDate if @calendar_input.inputmask("isComplete") then moment(e.target.value, "DD.MM.YYYY").toDate() else @maxDate
        
        _efDate = moment(e.target.value, "DD.MM.YYYY").format("YYYY-MM-DD")
        @mob_trigger_calendar_input.val _efDate

      .inputmask
        placeholder: "__.__.____"
        alias: "dd.mm.yyyy"
        yearrange:
          minyear: @minDate.getFullYear()
          maxyear: @maxDate.getFullYear()
        greedy: off
        showMaskOnHover: off
        # oncomplete: (e) => @$scope.$storage.strgData.bday = if @calendar_input.inputmask("isComplete") then e.target.value else
        # onKeyDown: (e) => @$scope.$storage.strgData.bday = e.target.value

      if @$scope.$storage.strgData.bday
        # console.log @isValidRange(@$scope.$storage.strgData.bday, "DD.MM.YYYY")
        _val = if @isValidRange @$scope.$storage.strgData.bday, "DD.MM.YYYY" then @$scope.$storage.strgData.bday else moment(@maxDate).format("DD.MM.YYYY")
        # console.log _val
        @calendar_input.val _val
        if @$rootScope.isMobile
          _slfDate = moment(_val, "DD.MM.YYYY").format("YYYY-MM-DD")
          @mob_trigger_calendar_input.val _slfDate
          # @calendar_input.on "focus, click", (e) =>
          #   @mob_trigger_calendar_input.change()

      @initMask()

    @$timeout () =>
      @initCal()


  # initFormatDateFunction: (input) ->
  #   _t = @
  #   input.each ->
  #     Object.defineProperty @, "isValidRange",
  #       # value: false
  #       get: -> ((moment(@value, "YYYY-MM-DD").unix() <= moment(_t.maxDate, "DD.MM.YYYY").unix()) and (moment(@value, "YYYY-MM-DD").unix() >= moment(_t.minDate, "DD.MM.YYYY").unix()))
  #       # set: (val) -> @value = val #_t.formatDateFunction val, "DD.MM.YYYY"
  #       configurable: off
  #       enumerable: off
  #       writable: off

  # formatDateFunction: (date, format) ->
  #   moment date
  #     .format format

  isValidRange: (date, format) ->
    return (moment(date, format).unix() <= moment(@maxDate).unix()) and (moment(date, format).unix() >= moment(@minDate).unix())

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
    # if @$rootScope.isMobile is false
    _mobMask = $('input[name="phone"]')
    _t = @
    _mobMask.mask "+38 (099) 999-99-99", completed: () -> 
      _t.$scope.$storage.strgData.phone = @val()

    _nameMask = new Inputmask "U{1,64} (U{1,64})|(U{1,64} U{1,64})",
      greedy: off
      showMaskOnHover: off
      oncomplete: (e) => @$scope.$storage.strgData.name = e.target.value
    # param =
    #   mask: "U{1,64} (U{1,64})|(U{1,64} U{1,64})"
    #   greedy: off
    #   showMaskOnHover: off
    #   oncomplete: (e) => @$scope.$storage.strgData.name = e.target.value
    # if @$rootScope.isMobile is false
    _nameMask.mask $('input[name="fullname"]')[0]
    # .inputmask param

    @$scope.main.loading = off

    # $ 'input[name="email"]'(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)
    #   .inputmask "email"039', '050', '063', '066', '067', '068', '073', '091', '092', '093', '094', '095', '096', '097', '098', '099'
    # allowCode = ['(039)','(050)','(063)','(066)','(067)','(068)','(073)','(091)','(092)','(093)','(094)','(095)','(096)','(097)','(098)','(099)']@maxDate.getFullYear() - 18
    # @minDate.setFullYear @minDate.getFullYear() - 90

    $.fn.form.settings.rules.dateRange = (value, dateRange) ->
      # console.log @, value, dateRange
      # _par = @parent().find "label"
      # _par.text moment(value, "YYYY-MM-DD").format("DD.MM.YYYY")
      # _iE = angular.element
      _calendar_input = $("input[name='bday']")
      _calendar = $("button.daterange").data "daterangepicker"
      _calendar_max_unix = _calendar?.maxDate.unix()
      status = @[0]
      status = if status.validity then status.validity?.valid else status.checkValidity?()
      status = _calendar_input.inputmask("isComplete") if status
      status = (moment(_calendar_input.val(), "DD.MM.YYYY").unix?() <= _calendar_max_unix) if status
      return status

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
            ,
              type: "dateRange"
              prompt: "Кредит могут получить лица возрастом от 18 до 90 лет"
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

