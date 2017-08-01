class threeCardsStepController
  constructor: (@$http, @$scope, @$sce, @$window, @$element, @$attrs) ->
    @card_hover = ""
    @content = []
    @content.push
      icon: "marker-map"
      title: "Подберём банки в вашем городе"
      text:  @$sce.trustAsHtml "Мы предложим кредиты в банках, у которых есть отделения в вашем городе или в ближайшем райцентре, если вы живёте в посёлке или селе. Украинские банки не дают кредиты жителям зоны АТО и Крыма."
    @content.push
      icon: "code"
      title: "Для чего банку ваш ИНН"
      text:  @$sce.trustAsHtml "Finance.ua соблюдает Закон Украины “О защите персональных данных”. Кроме банков и кредитных компаний ваш ИНН никто не получит. Банку индивидуальный налоговый номер нужен для проверки клиента. С помощью ИНН банк может узнать кредитную историю заёмщика, или проверить выплаты в пенсионный фонд."