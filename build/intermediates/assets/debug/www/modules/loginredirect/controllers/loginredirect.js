var folder_title = '';
App.config(function($stateProvider) {

    $stateProvider.state('loginredirect-view', {
        url: BASE_PATH+"/loginredirect/mobile_view/index/value_id/:value_id",
        controller: 'LoginredirectController',
        templateUrl: "modules/loginredirect/templates/l1/view.html"
    });


}).controller('LoginredirectController', function($ionicModal,$ionicHistory,$http,Url, $cordovaOauth,AUTH_EVENTS, $ionicScrollDelegate, $location,$window, $scope, $state,$rootScope, $translate, $stateParams, Loginredirect, Application, Customer, Dialog, HomepageLayout) {

   

    

	$scope.is_loading = false;

   

    $scope.loadContent = function() {
        if(!$rootScope.is_logged_in) return;
		$scope.is_loading = true;

       	$http({
            method: 'GET',
            url: Url.get("loginredirect/mobile_account_login/getallactivemenu"),
            //data: data,
            responseType:'json'
        }).success(function(data) {
        	$rootScope.accessibleValues = data.accessibleValues;
        	var location = window.location.href;
	        location = location.split("#");
	        location = location[0]+"#"+BASE_PATH+"/"+data.appurl;
	        $rootScope.redirectLoginUrl = location;
	        $rootScope.accessibleValues = data.accessibleValues;

            $rootScope.loginRedirected = true; 
	        window.location.href = $rootScope.redirectLoginUrl;
	       	$scope.is_loading = true;


        });
        
    };

});

App.run(function($rootScope,Loginredirect,$http,AUTH_EVENTS,Url,HomepageLayout,$state,$location,Application,$ionicHistory) {
	
	  $rootScope.$on(AUTH_EVENTS.logoutSuccess, function() {
        $rootScope.redirectLoginUrl = '';
        $rootScope.accessibleValues = {};
        $rootScope.is_logged_in = false;


    });
    
    $rootScope.$on(AUTH_EVENTS.loginSuccess, function() {
        $rootScope.is_logged_in = true;
			$http({
            method: 'GET',
            url: Url.get("loginredirect/mobile_account_login/getallactivemenu"),
            responseType:'json'
        }).success(function(data) {
        	$rootScope.accessibleValues = data.accessibleValues;
        	var location = window.location.href;
	        location = location.split("#");
	        location = location[0]+"#"+BASE_PATH+"/"+data.appurl;
	        $rootScope.redirectLoginUrl = location;
	        $rootScope.accessibleValues = data.accessibleValues;
	        
	        if($ionicHistory.currentStateName()=="loginredirect-view"){
	        	if(HomepageLayout.properties.options.autoSelectFirst ){
	        		$ionicHistory.nextViewOptions({
                    historyRoot: true,
                    disableAnimate: false,
                    disableBack:true
                });
	        		
	        	}
	        	window.location.href = $rootScope.redirectLoginUrl;
	        }

        });	



    });
    

	 $rootScope.accessibleValues = [];
	 $rootScope.redirectLoginUrl = '';
	 $rootScope.home = "home";
	 $rootScope.loginRedirected = 0;



	 $http({
            method: 'GET',
            url: Url.get("loginredirect/mobile_account_login/getallactivemenu"),
            //data: data,
            responseType:'json'
        }).success(function(data) {
        	$rootScope.accessibleValues = data.accessibleValues;
            
        });

     HomepageLayout.getFeatures().then(function (features) {
            console.log("features");
            console.log(features);
            var LoginRedirect = false;
            var cnt =0;
            for(var i = 0; i <  features.data.pages.length; i++){

                if(features.data.pages[i].code=="loginredirect")
                    LoginRedirect = true;

            }
            $rootScope.home = features.data.pages[0].path;
             $rootScope.home = features.data.pages[0].path;
            var location = window.location.href;
	        location = location.split("#");
	        location = location[0]+"#"+$rootScope.home;
            $rootScope.home = location;
            
            /* if loginredirect enabled and user is trying to visit other page directly*/
            if(LoginRedirect && window.location.href != $rootScope.home){
				/** send user to home and disbale back button(for sidemenulayout) **/
				 $ionicHistory.nextViewOptions({
                    historyRoot: true,
                    disableAnimate: false,
                    disableBack:true
                });
                if(!HomepageLayout.properties.options.autoSelectFirst)
                	$state.go("home");
                else
             		window.location.href = $rootScope.home;

            }
         });

    
    
     $rootScope.$on('$stateChangeStart', function(event, toState,toParams, fromState, fromParams){

		/** if user is visiting the loginredirect view ***/
        if($rootScope.redirectLoginUrl!="" && fromParams.value_id!=$rootScope.loginRedirected && toState.name=="loginredirect-view"){
            event.preventDefault();
           
            $rootScope.loginRedirected = toParams.value_id; 
            window.location.href = $rootScope.redirectLoginUrl;  // commented for now
            
			/** if user is coming back from login redirected view **/
        }else if($rootScope.redirectLoginUrl!="" && fromParams.value_id==$rootScope.loginRedirected  && toState.name=="loginredirect-view"){
         	$rootScope.loginRedirected = 0;
            event.preventDefault();

	        if(!Application.is_customizing_colors && HomepageLayout.properties.options.autoSelectFirst ){

                $ionicHistory.nextViewOptions({
                    historyRoot: true,
                    disableAnimate: false,
                    disableBack:true
                });
                window.location.href = $rootScope.home;
            
            }else{
            	$state.go("home");
            }


    }

    })
   



    
});


