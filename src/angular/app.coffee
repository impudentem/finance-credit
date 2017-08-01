class financeAppController
  constructor: (@$http, @$scope, @$storage, @$location) ->

    @loading = on

    @form_data =
      aims: 0
      amount: 0

    @currentStep = 1
    @maxStep = 3

    # window.locprv = @$location
    # @$scope.$watch (newValue, oldValue, scope) =>
    #   @$scope.main.currentStep
    # , (newValue, oldValue, scope) =>
    #   @init() if newValue is 2
    #   return false
    @$scope.$on '$locationChangeStart', (e, newUrl, oldUrl, newState, oldState) =>
      # regStep = new RegExp /\d*$/gi
      # fStep = regStep.exec @$location.path()
      # fStep = if fStep.length then fStep[0] else @$location.path()
      # @currentStep = fStep
      console.log e, newUrl, oldUrl, newState, oldState, @$location.path()
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
