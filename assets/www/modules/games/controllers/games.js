App.config(function($stateProvider, $urlRouterProvider, HomepageLayoutProvider) {
    $stateProvider.state('games-view', {
        url: BASE_PATH + "/games/mobile_view/index/value_id/:value_id",
        controller: 'GamesController',
        templateUrl: "modules/games/templates/l1/view.html"
    });
}).controller('GamesController', function($scope, $stateParams, $state, Games,$ionicPopup,$ionicModal,$location,$translate) {
    $scope.value_id = Games.value_id = $stateParams.value_id;
    var base_location,fileName,uri,n;
    $scope.loadgame = function(name) {
        base_location = Games.settings.base_path;
        n = name;
        fileName = "games/" + name ;
        if( typeof cordova.file == "undefined" ) {
            $ionicPopup.alert({
                title: $translate.instant('Information'),
                template: $translate.instant("This feature is availabel from the application only")
            });
            return false;
        }
        store = cordova.file.dataDirectory;
         //Check for the file.
        window.resolveLocalFileSystemURL(store + fileName, appStart, downloadAsset);
    };
    function appStart(entry) {
        /  open add grous popup windows /
        var target = device.platform == 'iOS'? '_self':'_blank';
        window.open(store + fileName +'/index.html', target,'location=no');
        //window.open(store + fileName +'/index.html', '_blank','location=no');
    }
    function downloadAsset() {
        Games.createGameZipRequest(n).success(function(data) {
            if(data.status) {
                uri = base_location + data.path;
                assetURL = encodeURI(uri);
                var fileTransfer = new FileTransfer();
                var myPopup = $ionicPopup.show({
                                template: '<progress id="progressbar" max="100" value="{{ progressval }}"> </progress>',
                                title: $translate.instant('Game is being downloaded'),
                                subTitle: $translate.instant('Please wait...'),
                                scope: $scope,
                            });
                $scope.progressval = 0;
                fileTransfer.onprogress = function(progressEvent) {
                    if (progressEvent.lengthComputable) {
                        var perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
                        console.log( perc + "% loaded...");
                        $scope.progressval = $scope.perc = perc;
                        /*if( $scope.progressval >= 100 ) {
                            myPopup.close();
                        }*/
                    } else {
                        console.log( "Loading...");
                    }
                };
                fileTransfer.download(assetURL, store + fileName + '.zip',
                    function(entry) {
                        myPopup.close();
                        zip.unzip(store + "games/" + n + ".zip", store + "games/" + n, function(e) {
                            if(e == 0) {
                                window.resolveLocalFileSystemURL(store + "games/", function(dir) {
                                    dir.getFile(n + ".zip", {create:false}, function(fileEntry) {
                                      fileEntry.remove(function(){
                                          // The file has been removed succesfully
                                          appStart(entry);
                                      },function(error){
                                          console.log(" Error deleting the file" + error);
                                      },function(){
                                         console.log(" The file doesn't exist");
                                      });
                                    });
                                });
                            }
                        });
                    },
                    function(err) {
                        console.log("Error" + err);
                        myPopup.then(function(){
                            $ionicPopup.alert({
                                title: $translate.instant('Information'),
                                template: $translate.instant("Error! Please try again")
                            });
                        });
                        myPopup.close();
                    });
            } else {
                $ionicPopup.alert({
                    title: $translate.instant('Information'),
                    template: data.message
                });
            }
        });
    }
    $scope.$on("$ionicView.beforeEnter", function(event, data){
        Games.getSettings().success(function(data) {
            Games.settings = data.settings;
            $scope.settings = Games.settings;
            Games.getGames().success(function(data) {
                if( typeof cordova.file !== "undefined" ) {
                    store = cordova.file.dataDirectory;
                } else {
                    store = '';
                }
                if(data.available_games.length == 1) {
                    //code to load game if only one available
                    $scope.loadgame(data.available_games[0].key);
                } else {
                    angular.forEach(data.available_games, function(value, key) {
                        value.exist = false;
                        if( store !== '' ) {
                            window.resolveLocalFileSystemURL(store + 'games/' + value.key, function() {
                                value.exist = true;
                            }, function() {
                                value.exist = false;
                            });
                        }
                    });
                }
                $scope.page_title = data.page_title;
                $scope.games = data.available_games;
                $scope.path = data.path;
            }).finally(function() {
                //$scope.is_loading = false;
            });
        });
    });
});