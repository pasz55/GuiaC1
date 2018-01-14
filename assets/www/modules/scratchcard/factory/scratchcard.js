App.factory('Scratchcard', function($rootScope, $http, Url) {

    var factory = {};

    factory.value_id = null;

    factory.findAll = function(customer_id) {

        if(!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("scratchcard/mobile_view/findall", {value_id: this.value_id, customer_id: customer_id}),
            cache: false,
            responseType:'json'
        });
    };

    factory.logAttempt = function(card_id, customer_id, reward_id, is_win, points) {
        return $http({
            method: 'GET',
            url: Url.get("scratchcard/mobile_view/logattempt", {card_id: card_id, customer_id: customer_id, reward_id: reward_id, win: is_win, points: points}),
            cache: false,
            responseType:'json'
        });
    };

    factory.validate = function(pad) {

        if(!this.value_id) return;

        var url = Url.get("scratchcard/mobile_view/validate", {value_id: this.value_id});

        var data = {
            reward_id: pad.reward.attempt_id,
            password: pad.password
        };

        return $http.post(url, data);
    };

    return factory;
});
