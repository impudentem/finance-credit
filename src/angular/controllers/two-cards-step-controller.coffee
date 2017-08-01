class twoCardsStepController
  constructor: (@$http, @$scope, @$sce, @$window, @$element, @$attrs) ->
    @card_hover = ""
    @content = []
    @content.push
      icon: "user"
      title: "Получите +15%"
      text:  @$sce.trustAsHtml "к вероятности одобрения кредита, заполнив фамилию, имя и отчество."
    @content.push
      icon: "smartphone-text"
      title: "Зачем давать номер телефона?"
      text:  @$sce.trustAsHtml "Для связи. Представитель банка позвонит вам, чтобы обсудить условия кредита."
    @content.push
      icon: "adult"
      title: "А возраст им зачем?"
      text:  @$sce.trustAsHtml "Перед выдачей денег ваш возраст проверят по паспорту. Если вам не исполнилось 18, то шансов получить кредит нет."