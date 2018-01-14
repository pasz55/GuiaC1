App.factory('Games', function($rootScope, $http, Url) {
    var factory = {};
    factory.value_id = null;
    factory.settings = {};
    factory.getSettings = function() {
        if (!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("games/mobile_view/settings", { value_id: this.value_id }),
            cache: false,
            responseType: 'json'
        });
    };
    
    factory.getGames = function() {
        if (!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("games/mobile_view/index", { value_id: this.value_id }),
            cache: false,
            responseType: 'json'
        });
    };
    
    factory.createGameZipRequest = function(name) {
        if (!this.value_id) return;
        return $http({
            method: 'GET',
            url: Url.get("games/mobile_view/creategamezip", { value_id: this.value_id, name:name }),
            cache: false,
            responseType: 'json'
        });
    };
    return factory;
});