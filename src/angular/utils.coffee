Date::getDateAdd = (date, interval, units) ->
  ret = new Date date
  checkRollover = -> ret.setDate 0 if ret.getDate() isnt date.getDate()

  switch interval.toLowerCase()
    when "year"
      ret.setFullYear ret.getFullYear() + units
      checkRollover()

    when "quarter"
      ret.setMonth ret.getMonth() + 3*units
      checkRollover()

    when "month"
      ret.setMonth ret.getMonth() + units
      checkRollover()

    when "week"
      ret.setDate ret.getDate() + 7*units

    when "day"
      ret.setDate ret.getDate() + units

    when "hour"
      ret.setTime ret.getTime() + units*3600000

    when "minute"
      ret.setTime ret.getTime() + units*60000

    when "second"
      ret.setTime ret.getTime() + units*1000

    else
      ret = undefined

  return ret


Object.size = (obj) ->
  Object.keys(obj).length

Object.get = (obj, path, curr = obj) ->
  paths = path.split "."
  for key in paths
    curr = if curr[key] isnt undefined then curr[key] else undefined
  return curr




try
  ce = new window.CustomEvent 'test'
  ce.preventDefault()
  if ce.defaultPrevented isnt on
    throw new Error 'Could not prevent default'
catch e
  CustomEvent = (event, params) ->
    params = params or
      bubbles: off
      cancelable: off
      detail: undefined

    evt = document.createEvent "CustomEvent"
    evt.initCustomEvent event, params.bubbles, params.cancelable, params.detail
    origPrevent = evt.preventDefault
    evt.preventDefault = ->
      origPrevent.call @
      try
        Object.defineProperty @, 'defaultPrevented',
          get: -> on
      catch e
        this.defaultPrevented = on
    return evt

  CustomEvent.prototype = window.Event.prototype
  window.CustomEvent = CustomEvent