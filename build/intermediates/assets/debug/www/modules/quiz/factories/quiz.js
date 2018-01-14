App.factory('Quiz', function($rootScope, $http, $window, Url) {

    var factory = {};

    factory.value_id = null;

    factory.findAll = function() {

        if(!this.value_id) return;

        return $http({
            method: 'GET',
            url: Url.get("quiz/mobile_view/find", {value_id: this.value_id, preview: $rootScope.isOverview ? 1 : 0}),
            cache: false,
            responseType:'json'
        });
    };

    factory.post = function (quiz_id, quiz, score, max_score) {
        if($rootScope.isOverview) {
            $rootScope.showMobileFeatureOnlyError();
            return false;
        }

        if (!this.value_id) return;

        var url = Url.get("quiz/mobile_view/post", {value_id: this.value_id, published_id: quiz_id});
        var data = {quiz: quiz, score: {score: score, max_score: max_score}};

        return $http.postForm(url, data);
    };

    var doneArray = function(value) {
        if($rootScope.isOverview)
            return [];

        if(_.isArray(value)) {
            $window.localStorage.setItem("sb-quiz-done", JSON.stringify(value));
        }

        var array = JSON.parse($window.localStorage.getItem("sb-quiz-done"));

        if(!_.isArray(array))
            array = [];

        return array;
    };

    factory.markAsDone = function (quiz_id) {
        if($rootScope.isOverview)
            return;

        done = doneArray();
        done.push(""+quiz_id);
        doneArray(_.compact(done));
    };

    factory.alreadyDone = function (quiz_id) {
        return !$rootScope.isOverview && doneArray().indexOf(""+quiz_id) >= 0;
    };

    return factory;
});
