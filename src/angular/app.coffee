class financeClassAppController
  constructor: (@$rootScope, @$scope, $localStorage, @$location, @$window, @$timeout, @$route, @$http, @$sceDelegate, @$sce) ->
    @$scope.$storage = @$storage = $localStorage.$default strgData: amount: 5000

    @loading = on
    @statusReq = off
    # console.log @$scope.$storage.strgData

    @currentStep = 1
    @maxStep = 3

    # console.log @$window
    # @$window.addEventListener "eventWidgetStep1", (e) -> console.log e
    # @$window.addEventListener "eventWidgetStep2", (e) -> console.log e
    # @$window.addEventListener "eventWidgetStep3", (e) -> console.log e
    # @$window.addEventListener "eventWidgetSuccess", (e) -> console.log e
    # @$window.addEventListener "eventWidgetError", (e) -> console.log e

    @$scope.$on '$locationChangeStart', (e, newUrl, oldUrl, newState, oldState) =>
      regNumStep  = new RegExp /\d$/
      regNameStep = new RegExp /\w+\d?$/

      fNumStep  = regNumStep.exec  @$location.path()
      fNameStep = regNameStep.exec @$location.path()

      @currentStep = if fNumStep?.length then fNumStep[0] else 1
      _currentNameStep = if fNameStep?.length then fNameStep[0] else null
      @sendEvent _currentNameStep if _currentNameStep isnt "request"
      @currentStep = _currentNameStep if _currentNameStep is "request"
      if _currentNameStep is "request"
        @sendEvent if @statusReq then "#{_currentNameStep}.success" else "#{_currentNameStep}.error"
      @$scope.$apply() if not @$scope.$$phase
      # console.log @$location.path(), @currentStep, _currentNameStep
      @$timeout =>
        @init() if @currentStep is 1
        $ "html, body"
            .animate
              scrollTop: 0
            , 600 if _currentNameStep is "request"

        if _currentNameStep is "request"
          $ 'input[name="email"]'
            .inputmask
              alias: "email"
              # greedy: off
              # keepStatic: on
              showMaskOnHover: off
              oncomplete: (e) => @$scope.emailSubscr = e.target.value
          @$scope.main.loading = off


    $ =>
      @init()

  sendSubscr: ($event) ->
    _inEmail = $ "input[name=email]"
    _inEmail = _inEmail[0] if _inEmail.length
    if _inEmail.inputmask?.isValid() and _inEmail.inputmask?.isComplete()
      @$scope.main.loading = on
      @$scope.$apply() if not @$scope.$$phase
      params =
        email: @$scope.emailSubscr
      clbck = (responce) =>
        @$scope.main.loading = off
        @$scope.main.respMsg = @msgSubscr responce.data
        $ ".ui.page.dimmer"
          .dimmer "show"
        @$scope.emailSubscr = ""
        @$scope.$apply() if not @$scope.$$phase
      @$http.get @$rootScope.settings.apiSubscr.url,
        params: params
      .then clbck, clbck

  msgSubscr: (msg) ->
    switch msg
      when "Some fields are missing."
        "Заполните поле E-mail."
      when "Invalid email address."
        "Недействительный адрес электронной почты."
      when "Invalid list ID."
        "Недействительный идентификатор подписки."
      when "Already subscribed."
        "Вы уже подписаны."
      when "You're subscribed!"
        "Вы подписаны на наши новости!"
      else
        "Извините, не удалось подписаться. Пожалуйста, повторите попытку позже!"

  init: ->
    $ ".ui.clients .ui.images"
      .slick
        infinite: on
        centerMode: on
        autoplay: on
        # autoplaySpeed: 2000
        # adaptiveHeight: on
        # dots: off
        accessibility: off
        # arrows: off
        prevArrow : '<button class="slick-prev button icon basic" aria-label="Previous" type="button"></button>'
        nextArrow : '<button class="slick-next button icon basic" aria-label="Next" type="button"></button>'
        slideTrack: '<div class="slick-track images"/>'
        speed: 400
        slidesToShow: 4
        slidesToScroll: 1
        responsive: [
          breakpoint: 1199
          settings:
            slidesToShow: 3
            slidesToScroll: 1
            arrows: off
        ,
          breakpoint: 1000
          settings:
            slidesToShow: 2
            slidesToScroll: 1
            arrows: off
        ,
          breakpoint: 768
          settings:
            autoplay: off
            slidesToShow: 1
            slidesToScroll: 1
            arrows: on
        ]
    $ ".ui.sidebar"
      .sidebar "attach events", ".toc.item"
      .sidebar "setting", "dimPage", on
      .sidebar "setting", "transition", "push"
      .sidebar "setting", "useLegacy", on



    $ ".ui.accordion"
      .accordion()
    $ ".main.container"
      .visibility
        once: off
        onOffScreen: (calculations) ->
          _btn = $ ".menu .computer-only .ui.button"
          _btn.transition 'scale in'
        onOnScreen: (calculations) ->
          _btn = $ ".menu .computer-only .ui.button"
          _btn.transition 'scale out' if not _btn.hasClass "hidden"

  titleStep: ->
    "Шаг #{@currentStep} из #{@maxStep}"


  scrollTo: ($event, id)->
    $ "html, body"
      .animate scrollTop: $(id).offset().top
      , 600

  sendEvent: (evnt) ->
    # console.log evnt
    evnt = Object.get @$rootScope.settings.events, evnt
    @$window.dispatchEvent evnt
