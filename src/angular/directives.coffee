angular.module 'finance-directives', ['ngMask']
.directive 'firstStep', () ->
  restrict: 'E'

  templateUrl: 'template/form_step1.html'

  controller: ['$http', '$scope', '$rootScope', '$sce', '$location', '$element', '$sceDelegate', '$filter', '$timeout', firstStepController]

  controllerAs: 'form_first'

.directive 'twoStep', () ->
  restrict: 'E'

  templateUrl: 'template/form_step2.html'

  controller: ['$http', '$scope', '$rootScope', '$sce', '$location', '$element', '$sceDelegate', '$filter', '$timeout', twoStepController]

  controllerAs: 'form_two'

.directive 'threeStep', () ->
  restrict: 'E'

  templateUrl: 'template/form_step3.html'

  controller: ['$http', '$scope', '$rootScope', '$sce', '$location', '$element', '$sceDelegate', '$filter', '$timeout', threeStepController]

  controllerAs: 'form_three'

.directive 'firstCardsStep', () ->
  restrict: 'E'

  templateUrl: 'template/cards_step1.html'

  controller: ['$http', '$scope', '$sce', '$window', '$element', '$attrs', firstCardsStepController]

  controllerAs: 'cards_first'

.directive 'twoCardsStep', () ->
  restrict: 'E'

  templateUrl: 'template/cards_step2.html'

  controller: ['$http', '$scope', '$sce', '$window', '$element', '$attrs', twoCardsStepController]

  controllerAs: 'cards_two'

.directive 'threeCardsStep', () ->
  restrict: 'E'

  templateUrl: 'template/cards_step3.html'

  controller: ['$http', '$scope', '$sce', '$window', '$element', '$attrs', threeCardsStepController]

  controllerAs: 'cards_three'
