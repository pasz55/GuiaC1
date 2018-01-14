
App.factory('Surveys', function($rootScope, $http, $window, Url) {

    var factory = {};

    factory.value_id = null;
    factory.retake = {};

    factory.findAll = function() {

        if(!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("surveys/mobile_view/find", {value_id: this.value_id, preview: $rootScope.isOverview ? 1 : 0}),
            cache: false,
            responseType:'json'
        });
    };

    factory.post = function (survey_id, survey) {
        if($rootScope.isOverview) {
            $rootScope.showMobileFeatureOnlyError();
            return;
        }

        if (!this.value_id) return;

        var url = Url.get("surveys/mobile_view/post", {value_id: this.value_id, published_id: survey_id});
        var data = {survey: survey};

        return $http.postForm(url, data);
    };

    var doneArray = function(value) {
        if($rootScope.isOverview)
            return [];

        if(_.isArray(value)) {
            $window.localStorage.setItem("sb-surveys-done", JSON.stringify(value));
        }

        var array = JSON.parse($window.localStorage.getItem("sb-surveys-done"));

        if(!_.isArray(array))
            array = [];

        return array;
    };

    factory.markAsDone = function (survey_id) {
        if($rootScope.isOverview)
            return;

        done = doneArray();
        done.push(""+survey_id);
        doneArray(_.compact(done));
    };

    factory.alreadyDone = function (survey_id) {
        return (!(factory.retake[survey_id] == 0 ? false : true)) && (!$rootScope.isOverview && doneArray().indexOf(""+survey_id) >= 0);
    };

    return factory;
});
