
App.factory('OptionsFactory', function ($rootScope, $http, httpCache, Url, CACHE_EVENTS, Customer) {
  var factory = {};
  factory.value_id = null;

  factory.findAll = function (options)
  {
    if (!this.value_id) return;

    angular.extend(options, {
      value_id: this.value_id
    });

    return $http({
      method: 'POST',
      url: Url.get( "donation/mobile_view/findall", {value_id: this.value_id}),
      data: options,
      cache: false,
      responseType:'json'
    });
  };

  factory.find = function (place_id)
  {
    if(!this.value_id) return;

    return $http({
      method: 'GET',
      url: Url.get("donation/mobile_view/find", {value_id: this.value_id}),
      cache: false,
      responseType:'json'
    });
  };

  return factory;
});
