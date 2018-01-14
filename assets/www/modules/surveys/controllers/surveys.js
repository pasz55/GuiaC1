App.config(function($stateProvider) {

    $stateProvider.state('surveys-view', {
        url: BASE_PATH+"/surveys/mobile_view/index/value_id/:value_id",
        controller: 'SurveysViewController',
        templateUrl: "modules/surveys/templates/l1/view.html",
    });

}).controller('SurveysViewController', function(_, $cordovaCamera, $cordovaGeolocation, $http, $ionicActionSheet, $ionicHistory, $ionicScrollDelegate, $location, $rootScope, $scope, $state, $stateParams, $timeout, $translate, Application, Dialog, Surveys, GoogleMaps) {

    var EMAIL_REGEXP = /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+\/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+\/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

    $scope.$on("connectionStateChange", function(event, args) {
        if(args.isOnline == true) {
            $scope.loadContent();
        }
    });

    $scope.is_loading = true;
    $scope.can_take_pictures = !Application.is_webview;
    $scope.value_id = Surveys.value_id = $stateParams.value_id;


    var _pages, _previous_pages, _current_page, _next_page, _formDataToSend, _pristine;
    var _pristineSurvey = function() {
        $scope.survey_id = null;
        $scope.thank_you = null;
        $scope.formData = {};
        $scope.preview_src = {};
        $scope.geolocation = {};
        $scope.no_previous = true;
        $scope.sections = [];
        $scope.isPreview = false;

        _pages = [];
        _previous_pages = [];
        _current_page = null;
        _next_page = null;
        _formDataToSend = [];
        _pristine = true;
    };
    _pristineSurvey();

    $scope.isCurrentSection = function(section) { return section === _.get(_.find(_pages, {id: _current_page}), "section"); };
    $scope.isCurrentPage = function(field) { return field === _current_page; };
    $scope.isNextPage = function(field) { return field === _next_page; };

    $scope.loadContent = function() {
        _pristineSurvey();
        $scope.is_loading = true;

        Surveys.findAll().success(function(data) {
            if((data.survey_id === "preview" && $rootScope.isOverview) || _.isNumber(+data.survey_id) && +data.survey_id > 0) {
                if(data.survey_id === "preview") {
                    $scope.isPreview = true;
                }
                $scope.survey_id = +data.survey_id;
                $scope.thank_you = data.thank_you;

                $scope.retake = data.retake;
                Surveys.retake[data.survey_id] = $scope.retake;
console.log("already done1:", Surveys.retake[data.survey_id]);
console.log("already done:", Surveys.alreadyDone($scope.survey_id));
                if(Surveys.alreadyDone($scope.survey_id)) {
                    _current_page = "view_end";
                } else {
                    $scope.sections = _.isArray(data.sections) && data.sections || null;

                    _.forEach($scope.sections, function(section) {
                        if(_.isObject(section.fields) && _.isArray(section.fields)) {
                            _.forEach(section.fields, function(field) {
                                _pages.push(_.merge({}, field, { section: section.id, hidden_by: [] }));
                            });
                        }
                    });

                    $scope.computeNextPage();
                }
            }

            $scope.page_title = data.page_title;
        }).error(function() {

        }).finally(function() {
            $scope.is_loading = false;
        });

    };
    $scope.$on("$ionicView.beforeEnter", function() {
        if(_pristine) {
            $scope.loadContent();
        }
    });

    $scope.getLocation = function(field) {

        if($scope.geolocation[field.id]) {

            $scope.is_loading = true;

            $cordovaGeolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }).then(function(position) {

                GoogleMaps.reverseGeocode(position.coords).then(function(results) {
                    if (results[0]) {
                        $scope.formData[field.id] = results[0].formatted_address;
                    } else {
                        $scope.formData[field.id] = position.coords.latitude + ", " + position.coords.longitude;
                    }
                    $scope.is_loading = false;
                }, function(data) {
                    $scope.formData[field.id] = null;
                    $scope.geolocation[field.id] = false;
                    $scope.is_loading = false;
                });

            }, function(e) {
                $scope.is_loading = false;

                $scope.formData[field.id] = null;
                $scope.geolocation[field.id] = false;

            });

        } else {
            $scope.formData[field.id] = null;
        }
    };

    $scope.takePicture = function(field) {

        if(!$scope.can_take_pictures) {
            $rootScope.showMobileFeatureOnlyError();
            return;
        }

        var source_type = Camera.PictureSourceType.CAMERA;

        // Show the action sheet
        var hideSheet = $ionicActionSheet.show({
            buttons: [
                { text: $translate.instant("Take a picture") },
                { text: $translate.instant("Import from Library") }
            ],
            cancelText: $translate.instant("Cancel"),
            cancel: function() {
                hideSheet();
            },
            buttonClicked: function(index) {
                if(index == 0) {
                    source_type = Camera.PictureSourceType.CAMERA;
                }
                if(index == 1) {
                    source_type = Camera.PictureSourceType.PHOTOLIBRARY;
                }

                var options = {
                    quality : 90,
                    destinationType : Camera.DestinationType.DATA_URL,
                    sourceType : source_type,
                    encodingType: Camera.EncodingType.JPEG,
                    targetWidth: 1200,
                    targetHeight: 1200,
                    correctOrientation: true,
                    popoverOptions: CameraPopoverOptions,
                    saveToPhotoAlbum: false
                };

                $cordovaCamera.getPicture(options).then(function(imageData) {
                    $scope.preview_src[field.id] = "data:image/jpeg;base64," + imageData;
                    $scope.formData[field.id] = "data:image/jpeg;base64," + imageData;
                }, function(err) {
                    // An error occured. Show a message to the user
                });

                return true;
            }
        });

    };

    var _get_hidden_pages_by = function(page_id) {
        var page = _.find(_pages, {id: page_id});
        if(_.isObject(page)) {
            var hidden_pages = [];

            _.forEach(page.actions, function(action) { // And taking all future pages to hide
                if(/hide\('([\w]+)'\)/.test(action.reaction)) {
                    var argument = null;
                    if(action.trigger == "always()") {
                        if(argument = _.get((action.reaction.match(/hide\('([\w]+)'\)/)), "[1]")) {
                            hidden_pages.push(argument);
                        }
                    } else if(argument = _.get((action.trigger.match(/answer\('([\w]+)'\)/)), "[1]")) {
                        if($scope.formData[page_id] === argument) {
                            if(argument = _.get((action.reaction.match(/hide\('([\w]+)'\)/)), "[1]")) {
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
    }

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

            var end_survey = false;

            _.forEach(current_page.actions, function(action) { // And taking all future pages to hide
                var do_reaction = false;

                if(action.trigger == "always()") {
                    do_reaction = true;
                } else {
                    var argument = null;
                    if(argument = _.get((action.trigger.match(/answer\('([\w]+)'\)/)), "[1]")) {
                        if(current_page.type === "checkbox") {
                            do_reaction = (_.get($scope.formData[_current_page], "["+argument+"]") === true);
                        } else {
                            do_reaction = ($scope.formData[_current_page] === argument);
                        }
                    }
                }

                if(do_reaction) {
                    var argument = null;
                    if(argument = _.get((action.reaction.match(/hide\('([\w]+)'\)/)), "[1]")) {
                        tmp_hidden_pages.push(argument);
                    } else if (argument = _.get((action.reaction.match(/skip\('([\w]+)'\)/)), "[1]")) {
                        next_page_candidates.push(_.find(_pages, {id: argument}));
                    } else if (action.reaction === "end()") {
                        end_survey = true;
                    }
                }
            });

            if(end_survey === true) {
                _next_page = "view_end";
            } else {
                next_page_candidate = _.last(_.sortBy(_.reject(_.compact(next_page_candidates), function(page) {
                    return (!_.isObject(page) || !_.isString(page.id))
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
            var value = $scope.formData[_current_page];

            if(current_page.type == "checkbox" && _.isObject(value)) {
                value = _.join(_.compact(_.values(value)), ";");
            }

            if(/^image|geoloc$/.test(current_page.type) && Application.is_webview) {
                current_page.required = false;
            }

            var valuePresent = ((!_.isNull(value) && !_.isUndefined(value) && !(_.isString(value) && _.trim(value).length < 1)));

            if(valuePresent && current_page.type == "nombre" && !_.isNumber(+value)) {
                Dialog.alert($translate.instant("Error"), $translate.instant("Answer must be a numerical value"), $translate.instant("OK"));
            } else if (valuePresent && current_page.type === "email" && !EMAIL_REGEXP.test(value)) {
                Dialog.alert($translate.instant("Error"), $translate.instant("Answer must be a valid email"), $translate.instant("OK"));
            } else if (valuePresent && current_page.type === "date" && !(_.isDate(value) || _.isDate(Date.parse(value)))) {
                Dialog.alert($translate.instant("Error"), $translate.instant("Answer must be a valid date"), $translate.instant("OK"));
            } else if(current_page.required && !valuePresent) {
                Dialog.alert($translate.instant("Error"), $translate.instant("Answer is required"), $translate.instant("OK"));
            } else {
                $scope.computeNextPage();

                if(_next_page === "view_end" && $rootScope.isOverview){
                    $rootScope.showMobileFeatureOnlyError();
                } else {
                    _set_hidden_pages_by(_current_page);
                    _formDataToSend.push(_current_page);
                    _previous_pages.push(_current_page);
                    $scope.no_previous = false;
                    _current_page = _next_page;

                    if(_current_page === "view_end") {
                        $scope.post();
                    } else {
                        $timeout(function() { $ionicScrollDelegate.scrollTop(true); });
                        $scope.computeNextPage();
                    }
                }
            }
        });
    }, 100, {trailing: true}); // Handle duplicate events (Bug in ionic)

    $scope.goPrevious = _.debounce(function() {
        if(_previous_pages.length > 0) {
            $timeout(function() {
                var prev=_previous_pages.pop();
                $scope.no_previous = (_previous_pages.length == 0);
                _revert_hidden_pages_by(prev);
                _.remove(_formDataToSend, function(item) { return item === prev; });

                _current_page = prev;

                $scope.computeNextPage();
                $timeout(function() { $ionicScrollDelegate.scrollTop(true); });
            });
        }
    }, 100, {trailing: true}); // Handle duplicate events (Bug in ionic)

    $scope.post = function() {
        $scope.is_loading = true;

        Surveys.post($scope.survey_id, _.pick($scope.formData, _formDataToSend)).success(function(data) {
            if(_.isObject(data) && data.success) {
                if(_.trim(data.message).length > 0) {
                    Dialog.alert("", data.message, $translate.instant("OK"));
                }
                Surveys.markAsDone($scope.survey_id);
                $scope.$on("$ionicView.leave", $timeout.bind(this, _pristineSurvey));
            } else {
                $scope.goPrevious();
            }
        }).error(function(data) {
            if(_.isObject(data) && _.trim(data.message).length > 0) {
                Dialog.alert($translate.instant("Error"), data.message, $translate.instant("OK"));
            }
            $scope.goPrevious();
        }).finally(function() {
            $scope.is_loading = false;
        });
    };

    $scope.goHome = function() {
        if($ionicHistory.backView()) {
            $ionicHistory.goBack();
        }
        else {
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

});
