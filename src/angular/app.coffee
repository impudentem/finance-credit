class financeAppController
  constructor: (@$rootScope, @$scope, $localStorage, @$location, @$window) ->
    @$scope.$storage = @$storage = $localStorage.$default strgData: amount: 5000

    @loading = on
    # console.log @$scope.$storage.strgData

    @currentStep = 1
    @maxStep = 3

    # console.log @$window
    @$window.addEventListener "eventWidgetStep1", (e) -> console.log e
    @$window.addEventListener "eventWidgetStep2", (e) -> console.log e
    @$window.addEventListener "eventWidgetStep3", (e) -> console.log e
    @$window.addEventListener "eventWidgetSuccess", (e) -> console.log e
    @$window.addEventListener "eventWidgetError", (e) -> console.log e

    @$scope.$on '$locationChangeStart', (e, newUrl, oldUrl, newState, oldState) =>
      regNumStep  = new RegExp /\d$/
      regNameStep = new RegExp /\w+\d?$/

      fNumStep  = regNumStep.exec  @$location.path()
      fNameStep = regNameStep.exec @$location.path()

      @currentStep = if fNumStep?.length then fNumStep[0] else 1
      _currentNameStep = if fNameStep?.length then fNameStep[0] else null
      @sendEvent _currentNameStep if _currentNameStep isnt "request"
      @currentStep = _currentNameStep if _currentNameStep is "request"
      @$scope.$apply() if not @$scope.$$phase
      console.log @$location.path(), @currentStep, _currentNameStep
      # return if meetsTheRequirementsToLeave()
      # newPath = @$location.path()
      # e.preventDefault()
      # checkIfUserWantsToLeave().then -> @$location.path newPath



    $ ->
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

  sendEvent: (evnt) ->
    console.log evnt
    evnt = Object.get @$rootScope.settings.events, evnt
    @$window.dispatchEvent evnt
