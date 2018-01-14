/*global
 BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("quiz-view", {
            url             : BASE_PATH + "/quiz/mobile_view/index/value_id/:value_id",
            controller      : "QuizViewController",
            templateUrl     : "modules/quiz/templates/l1/view.html",
            cache           : false
        });

}).controller("QuizViewController", function(_, $cordovaCamera, $ionicNavBarDelegate, $cordovaGeolocation, Loader, $http, $interval,
                                             $ionicActionSheet, $ionicHistory, $ionicScrollDelegate, $location,
                                             $rootScope, $scope, $state, $stateParams, $timeout, $translate,
                                             Application, Dialog, Quiz, GoogleMaps, Url) {

    $scope.is_loading = true;
    Loader.show();
    $scope.value_id = Quiz.value_id = $stateParams.value_id;

    var _pages, _previous_pages, _current_page, _next_page, _formDataToSend, _pristine, _question_timer;
    var _pristineQuiz = function() {
        $scope.quiz_id = null;
        $scope.settings = {};
        $scope.formData = {};
        $scope.maxScore = 0;
        $scope.currentScore = 0;
        $scope.preview_src = {};
        $scope.no_previous = true;
        $scope.sections = [];
        $scope.isPreview = false;
        $scope.already_done = false;
        $scope.has_answers = false;
        $scope.scoredQuestions = [];
        $scope.grade = {};
        $scope.grades = [];

        _question_timer = null;
        _pages = [];
        _previous_pages = [];
        _current_page = null;
        _next_page = null;
        _formDataToSend = [];
        _pristine = true;
    };
    _pristineQuiz();

    $scope.isCurrentSection = function(section) { return section === _.get(_.find(_pages, {id: _current_page}), "section"); };
    $scope.isCurrentPage = function(field) { return field === _current_page; };
    $scope.isNextPage = function(field) { return field === _next_page; };
    $scope.isCurrentPageScored = function() { return _.includes($scope.scoredQuestions, _current_page); };

    var _computeQuiz = function(quiz_data) {
        _pristineQuiz();
        $scope.settings = _.isObject(quiz_data) && _.isObject(quiz_data.settings) && quiz_data.settings || {};
        $scope.grades = quiz_data.grades;
        $scope.thank_you = $scope.settings.thank_you;
        $scope.sections = _.isObject(quiz_data) && _.isArray(quiz_data.sections) && quiz_data.sections || null;

        _.forEach($scope.sections, function(section) {
            if(_.isObject(section.fields) && _.isArray(section.fields)) {
                section.fields = _.map(section.fields, function(field) {
                    var field = _.merge({}, field, { section: section.id, hidden_by: [] });
                    field.image = _.isString(field.image) && _.trim(field.image.length) > 0 ? Url.get(field.image, {remove_key: true}) : false;
                    field.options = _.map(field.options, function(opt) {
                        opt.image = _.isString(opt.image) && _.trim(opt.image.length) > 0 ? Url.get(opt.image, {remove_key: true}) : false;
                        return opt;
                    });

                    _pages.push(field);

                    return field;
                });
            }
        });
    };

    var _computeGrade = function() {
        var percent_correct = ($scope.currentScore*100/$scope.maxScore) || 0;
        $scope.grade = _.find($scope.grades, function(grade) {
            var value_to_compare = (grade.score_range_unit === "percent") ?
                    percent_correct : $scope.currentScore;
            return (
                value_to_compare >= grade.score_range_min &&
                    value_to_compare <= grade.score_range_max
            );
        });
    };

    $scope.loadContent = function() {
        $scope.is_loading = true;

        Loader.show();

        Quiz.findAll().success(function(data) {

            $ionicNavBarDelegate.title(data.page_title);
            $timeout(function() {
                $scope.page_title = data.page_title;
            });

            if((data.quiz_id === "preview" && $rootScope.isOverview) || _.isNumber(+data.quiz_id) && +data.quiz_id > 0) {
                var quiz = _.isObject(data.quiz_done) ? data.quiz_done : data.quiz;

                if(_.isObject(quiz)) {
                    if((Quiz.alreadyDone(+data.quiz_id) && !_.get(quiz, "settings.allow_retake")) || _.isObject(data.quiz_done)) {
                        _computeQuiz(quiz);

                        if(_.isObject(data.quiz_answers)) {
                            $scope.formData = data.quiz_answers;
                            $scope.has_answers = true;
                        }

                        $scope.current_timer = 0;
                        $scope.answersMode = true;

                        if(_.isObject(data.quiz_score)) {
                            $scope.currentScore = +data.quiz_score.score;
                            $scope.maxScore = data.quiz_score.max_score;
                            _computeGrade();
                        }
                        _current_page = "view_end";
                        $scope.already_done = true;
                    } else {
                        _computeQuiz(data.quiz);
                        $scope.computeNextPage();
                    }
                    if(data.quiz_id === "preview") {
                        $scope.isPreview = true;
                    }
                    $scope.quiz_id = +data.quiz_id;
                } else {
                    Dialog.alert($translate.instant("Error"), $translate.instant("An unexpected error occured"), $translate.instant("OK"));
                }
            }
        }).error(function() {
            Dialog.alert($translate.instant("Error"), $translate.instant("An unexpected error occured"), $translate.instant("OK"));
        }).finally(function() {
            $scope.is_loading = false;
            Loader.hide();
        });

    };

    var _configure_timer = function() {
        $interval.cancel(_question_timer);
        if(_current_page === "view_end")
            return; // we're done here

        var current_page = _.find(_pages, {id: _current_page});
        $scope.current_timer = isNaN(+current_page.time_limit) ? 0 : +current_page.time_limit;
        if($scope.current_timer > 0) {
            _question_timer = $interval(function() {
                $timeout(function() {
                    $scope.current_timer = $scope.current_timer - 1;
                    if($scope.current_timer <= 0) {
                        $scope.current_timer = 0;
                        $scope.goNext();
                    }
                });
            }, 1000);
        }
    };

    var _get_hidden_pages_by = function(page_id) {
        var page = _.find(_pages, {id: page_id});
        if(_.isObject(page)) {
            var hidden_pages = [];

            _.forEach(page.actions, function(action) { // And taking all future pages to hide
                if(/hide\('([\w]+)'\)/.test(action.reaction)) {
                    var argument = null;
                    if(action.trigger == "always()") {
                        if((argument = _.get((action.reaction.match(/hide\('([\w]+)'\)/)), "[1]"))) {
                            hidden_pages.push(argument);
                        }
                    } else if((argument = _.get((action.trigger.match(/answer\('([\w]+)'\)/)), "[1]"))) {
                        if($scope.formData[page_id] === argument) {
                            if((argument = _.get((action.reaction.match(/hide\('([\w]+)'\)/)), "[1]"))) {
                                hidden_pages.push(argument);
                            }
                        }
                    }
                }
            });

            return hidden_pages;
        }
        return [];
    };

    var _set_hidden_pages_by = function(page_id) {
        _.forEach(_get_hidden_pages_by(page_id), function(page_to_hide_id) {
            _pages[_.findIndex(_pages, {id: page_to_hide_id})].hidden_by.push(page_id);
        });
    };

    var _revert_hidden_pages_by = function(page_id) {
        _.forEach(_get_hidden_pages_by(page_id), function(page_to_hide_id) {
            _.remove(
                _pages[_.findIndex(_pages, {id: page_to_hide_id})].hidden_by,
                function(item) {
                    return item === page_id;
                }
            );
        });
    };

    $scope.computeNextPage = function() {

        if(!_.isArray(_pages) || _pages.length < 1)
            return;

        if(_current_page === null) {  // first init
            _previous_page = [];
            _current_page = _pages[0].id;
            _configure_timer();
        } else if(_current_page === "view_end") {
            _next_page = null;
        } else {
            var current_page = _.find(_pages, {id: _current_page});
            var next_page_candidates = [];

            var immediate_next_page = _pages[Math.min((_.findIndex(_pages, current_page)+1), _pages.length-1)];
            if(immediate_next_page != current_page) {
                next_page_candidates.push(immediate_next_page);
            }

            var tmp_hidden_pages = _.compact(_.map(_pages, function(page) {  // We'll save the hide when we really are going to next page
                if(_.isArray(page.hidden_by) && page.hidden_by.length > 0) {
                    return page.id; // We're just taking all already hidden pages to compute next page
                }
                return null;
            }));

            var end_quiz = false;

            _.forEach(current_page.actions, function(action) { // And taking all future pages to hide
                var do_reaction = false;

                if(action.trigger == "always()") {
                    do_reaction = true;
                } else {
                    var argument = null;
                    if((argument = _.get((action.trigger.match(/answer\('([\w]+)'\)/)), "[1]"))) {
                        if(current_page.type === "checkbox") {
                            do_reaction = (_.get($scope.formData[_current_page], "["+argument+"]") === true);
                        } else {
                            do_reaction = ($scope.formData[_current_page] === argument);
                        }
                    }
                }

                if(do_reaction) {
                    var argument = null;
                    if((argument = _.get((action.reaction.match(/hide\('([\w]+)'\)/)), "[1]"))) {
                        tmp_hidden_pages.push(argument);
                    } else if ((argument = _.get((action.reaction.match(/skip\('([\w]+)'\)/)), "[1]"))) {
                        next_page_candidates.push(_.find(_pages, {id: argument}));
                    } else if (action.reaction === "end()") {
                        end_quiz = true;
                    }
                }
            });

            if(end_quiz === true) {
                _next_page = "view_end";
            } else {
                next_page_candidate = _.last(_.sortBy(_.reject(_.compact(next_page_candidates), function(page) {
                    return (!_.isObject(page) || !_.isString(page.id));
                }), "id"));

                var found_next_page = false;
                while(found_next_page == false && _.isObject(next_page_candidate) && _.isString(_.get(next_page_candidate, "id"))) {
                     if(_.includes(tmp_hidden_pages, next_page_candidate.id)) {
                        next_page_candidate = _.get(_pages, "["+ (_pages.indexOf(next_page_candidate)+1) +"]");
                    } else {
                        found_next_page = true;
                    }
                }

                _next_page = _.get(next_page_candidate, "id") || "view_end";
            }
        }

    };

    $scope.goNext = _.debounce(function() {
        _pristine = false;
        $timeout(function() {
            var current_page = _.find(_pages, {id: _current_page});
            if($scope.answersMode || $scope.settings.show_answers != 1 || current_page.type === "instructions") {
                var value = $scope.formData[_current_page];


                if(!$scope.isCurrentPageScored()) {

                    if(current_page.type !== "instructions") {
                        var correct_answers = _.filter(
                            current_page.options,
                            function(o) { return o.correct == 1; }
                        );

                        var this_question_max_score = (
                            (current_page.type === "checkbox") ? _.sum : _.max
                        )(_.map(correct_answers, "score"));

                        var this_question_score = 0;
                        _.forEach(correct_answers, function(opt) {
                            if(_.isObject(value) && _.includes(_.compact(_.keys(value)), opt.id) || value === opt.id) {
                                this_question_score += opt.score;
                            }
                        });

                        $scope.currentScore += isNaN(this_question_score) ? 0 : this_question_score;
                        $scope.maxScore += isNaN(this_question_max_score) ? 0 : this_question_max_score;

                        if(current_page.type == "checkbox" && _.isObject(value)) {
                            value = _.join(_.compact(_.keys(value)), ";");
                        }
                    }

                    $scope.scoredQuestions.push(_current_page);
                }


                $scope.computeNextPage();

                _set_hidden_pages_by(_current_page);
                _formDataToSend.push(_current_page);
                _previous_pages.push(_current_page);
                $scope.no_previous = false;
                _current_page = _next_page;
                $scope.answersMode = false;

                _configure_timer();
            } else {
                $interval.cancel(_question_timer);
                $scope.current_timer = 0;
                $scope.answersMode = true;
            }

            if(_current_page === "view_end") {
                $interval.cancel(_question_timer);
                $scope.current_timer = 0;
                $scope.has_answers = true;
                $scope.answersMode = true;
                _computeGrade();
                $scope.post();
            } else {
                $timeout(function() { $ionicScrollDelegate.scrollTop(true); });
                $scope.computeNextPage();
            }
        });
    }, 100, {trailing: true}); // Handle duplicate events (Bug in ionic)

    var goPrevious = _.debounce(function() {
        $timeout(function() {
            var prev=_previous_pages.pop();
            $scope.no_previous = (_previous_pages.length == 0);
            _revert_hidden_pages_by(prev);
            _.remove(_formDataToSend, function(item) { return item === prev; });

            _current_page = prev;

            $scope.computeNextPage();
            $timeout(function() { $ionicScrollDelegate.scrollTop(true); });
        });
    }, 100, {trailing: true}); // Handle duplicate events (Bug in ionic)

    $scope.post = function() {
        $scope.is_loading = true;
        Loader.show();

        var promise = Quiz.post($scope.quiz_id, _.pick($scope.formData, _formDataToSend), $scope.currentScore, $scope.maxScore);

        if(promise) {
            promise.success(function(data) {
                if(_.isObject(data) && data.success) {
                    if(_.trim(data.message).length > 0) {
                        Dialog.alert("", data.message, "OK");
                    }
                    (!$scope.settings.allow_retake) && Quiz.markAsDone($scope.quiz_id);
                    $scope.$on("$ionicView.leave", $timeout.bind(this, _pristineQuiz));
                } else {
                    goPrevious();
                }
            });

            promise.error(function(data) {
                if(_.isObject(data) && _.trim(data.message).length > 0) {
                    Dialog.alert($translate.instant("Error"), data.message, $translate.instant("OK"));
                }
                goPrevious();
            })

            promise.finally(function() {
                $scope.is_loading = false;
                Loader.hide();
            });
        } else {
            Loader.hide();
        }

    };

    $scope.goHome = function() {
        if($ionicHistory.backView()) {
            $ionicHistory.goBack();
        } else {
            $ionicHistory.clearHistory();
            $ionicHistory.nextViewOptions({
                disableBack: true,
                historyRoot: true
            });
            $state.go("home", {}, {location:'replace'}).then(function() {
                $ionicHistory.backView(null);
                $ionicHistory.clearHistory();
            });
        }
    };

    $scope.loadContent();

});
