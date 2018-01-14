App.requires.push('payment');

App.config(function ($stateProvider, HomepageLayoutProvider)
{
  $stateProvider.state('donation-view', {
    url: BASE_PATH + "/donation/mobile_view/index/value_id/:value_id",
    controller: 'DonationViewController',
    templateUrl: "modules/donation/templates/l1/view.html",
      cache: false
  })
  .state('donation-donate', {
    url: BASE_PATH + "/donation/mobile_donate/index/value_id/:value_id/stripe_pub_key/:stripe_pub_key/page_title/:page_title/amount_to_donate/:amount_to_donate/currency/:currency/msg_congrats/:msg_congrats/twocheckout_sid/:twocheckout_sid/gateway/:gateway",
    controller: 'DonationDonateController',
    templateUrl: "modules/donation/templates/l1/donate.html"
  })
  .state('donation-confirm', {
    url: BASE_PATH + "/donation/mobile_confirm/index/value_id/:value_id/msg_congrats/:msg_congrats/page_title/:page_title/amount_to_donate/:amount_to_donate/currency/:currency",
    controller: 'DonationConfirmController',
    templateUrl: "modules/donation/templates/l1/confirm.html"
  });
})
.controller('DonationViewController', function ($log, $cordovaGeolocation, $cordovaSocialSharing, $ionicModal, $rootScope, $scope, $state, $stateParams, $timeout, $translate, $window, Application, Customer, OptionsFactory, Url)
{
  $scope.vm = {}
  $scope.vm.isToOpenInBrowser = true;
  $scope.vm.isPad = ionic.Platform.isIPad();
  $scope.vm.isIOS = ionic.Platform.isIOS();
  $scope.vm.isApple = (ionic.Platform.isIPad() || ionic.Platform.isIOS())

  $log.log('plateform: ' + ionic.Platform.platform())
  $log.log('isPad: ' + ionic.Platform.isIPad() + ' isIOS: ' + ionic.Platform.isIOS())
  $log.log('isWebview: ' + ionic.Platform.isWebView())

  //$window.open('https://google.com', '_system', 'location=yes');
  $scope.openInNav = function () {
    //var DOMAIN = "https://" + $window.location.host;
    $log.log('Open in browser: ' + 'https://' + $scope.hostname + "/app/local/modules/Donation/webview/index.html#/index/value_id/" + $scope.value_id + "/amount_to_donate/" + $scope.data.amount_to_donate)
    $window.open('https://' + $scope.hostname + "/app/local/modules/Donation/webview/index.html#/index/value_id/" + $scope.value_id + "/amount_to_donate/" + $scope.data.amount_to_donate, '_system', 'location=yes');
  }

  $scope.is_loading = true;
  $scope.social_sharing_active = false;
  $scope.is_loading = true;
  $scope.value_id = OptionsFactory.value_id = $stateParams.value_id;
  $scope.modal = null;
  $scope.manage_modal = null;
  $scope.is_admin = false;
  $scope.collection = new Array();
  $scope.is_custom_amount = false;
  $scope.data = {
    'amount_to_donate' : null
  };

  $scope.$on("connectionStateChange", function(event, args)
  {
    if (args.isOnline === true) {
      $scope.loadContent();
    }
  });

  $scope.goDonate = function (valid_form)
  {

    if (valid_form) {
      if ($scope.amount_to_donate !== null && $scope.amount_to_donate !== "") {
        $state.go('donation-donate', {
          value_id: $scope.value_id,
          page_title: $scope.page_title,
          amount_to_donate: $scope.data.amount_to_donate,
          stripe_pub_key: $scope.stripe_pub_key,
          currency : $scope.currency,
          msg_congrats: $scope.msg_congrats,
          twocheckout_sid: $scope.twocheckout_sid,
          gateway: $scope.gateway_number
        })
      }
    }
  }

  $scope.isCustomAmount = function ()
  {
    if ($scope.amount_custom === '1')
      return true;
    else
      return false;
  }

  $scope.increaseAmount = function ()
  {
    $scope.data.amount_to_donate = parseInt($scope.data.amount_to_donate) + parseInt($scope.step_height);
  }

  $scope.decreaseAmount = function ()
  {
    if (!$scope.isMinAmountRequired()) {
      if (parseInt($scope.data.amount_to_donate) > parseInt($scope.step_height))
        $scope.data.amount_to_donate = parseInt($scope.data.amount_to_donate) - parseInt($scope.step_height);
    } else { // do not go under minimum amout (step_one)
      if (parseInt($scope.data.amount_to_donate) >= (parseInt($scope.step_one) + parseInt($scope.step_height)))
        $scope.data.amount_to_donate = parseInt($scope.data.amount_to_donate) - parseInt($scope.step_height);
    }
  }

  $scope.isMinAmountRequired = function ()
  {
    if ($scope.amount_min === '1')
      return true
    else
      return false
  }

  $scope.loadContent = function ()
  {
    $log.info("loading");
    $scope.is_loading = true;

    OptionsFactory.find()
    .success(function (data) {
      $log.info('received data: ' +  JSON.stringify(data))
      $scope.stripe_pub_key = data.collection.pub_key;
      $scope.amount_min = data.collection.amount_min;
      $scope.amount_custom = data.collection.amount_custom;
      $scope.step_one = data.collection.step_one;
      $scope.step_height = data.collection.step_height;
      $scope.msg_welcome = data.collection.msg_welcome;
      $scope.msg_congrats = data.collection.msg_congrats;
      $scope.page_title = data.page_title;
      $scope.collection = data.collection;
      $scope.hostname = data.collection.hostname;
      $scope.currency = data.collection.currency;
      $scope.open_browser = data.collection.open_browser;
      $scope.twocheckout_sid = "";
      $scope.gateway_number = parseInt(data.collection.gateway_number)
      $scope.gateway = {
        stripe: true,
        twocheckout: false,
      }
      if ($scope.use_stripe === "1") {
        $scope.gateway.stripe = true
        $scope.gateway.twocheckout = false
      }
      else {
        $scope.gateway.stripe = false
        $scope.gateway.twocheckout = true
        $scope.twocheckout_sid =  data.collection.twocheckout_sid;
      }

      if (parseInt($scope.open_browser) === 1)
        $scope.vm.isToOpenInBrowser = true
      else
        $scope.vm.isToOpenInBrowser = false 

      if (parseInt($scope.amount_custom) === 1)
        $scope.is_custom_amount = true
      else
        $scope.is_custom_amount = false

      if ($scope.amount_custom === '1') {
        $scope.data.amount_to_donate = 10;
      }
      else {
        if ($scope.amount_min === '1')
          $scope.data.amount_to_donate = $scope.step_one;
        else
          $scope.data.amount_to_donate = $scope.step_height;
      }
    })
    .finally(function () {
      if ($scope.gateway_number === 1) {
        if (typeof Stripe === "undefined") {
          $log.log('loading stripe')
          $scope.is_loading = true;

          var stripeJS = document.createElement('script');
          stripeJS.type = "text/javascript";
          stripeJS.src = "https://js.stripe.com/v2/";
          stripeJS.onload = function () {
            $timeout(function () {
              $scope.is_loading = false;
            });
          };
          document.body.appendChild(stripeJS);
        } else {
            $log.debug('no need to fetch stripe script');
          $scope.is_loading = false;
        }
      } else if ($scope.gateway_number === 2) {
        if (typeof TCO === "undefined") {
          $log.log('loading 2checkout')
          $scope.is_loading = true;

          var twocheckoutJS = document.createElement('script');
          twocheckoutJS.type = "text/javascript";
          twocheckoutJS.src = "https://www.2checkout.com/checkout/api/2co.min.js";
          twocheckoutJS.onload = function () {
            $timeout(function () {
              $scope.is_loading = false;
            });
          };
          document.body.appendChild(twocheckoutJS);
        } else {
            $log.debug('no need to fetch 2checkout script');
          $scope.is_loading = false;
        }
      }
      $scope.is_loading = false;
    });
  };

  $scope.loadContent();
})
.controller('DonationDonateController', function ($log, $cordovaGeolocation, $cordovaSocialSharing, $ionicModal, $rootScope, $scope, $state, $stateParams, $timeout, $translate, $window, $http, Url, Application, Customer, OptionsFactory)
{
  $log.log('DonationDonateController fired');
  $log.log('stateparam :' + JSON.stringify($stateParams))
  $scope.value_id = OptionsFactory.value_id = $stateParams.value_id;
  $scope.stripe_pub_key = $stateParams.stripe_pub_key;
  $scope.page_title = $stateParams.page_title;
  $scope.amount_to_donate = $stateParams.amount_to_donate;
  $scope.currency = $stateParams.currency;
  $scope.msg_congrats = $stateParams.msg_congrats;
  $scope.gateway_number = $stateParams.gateway;
  $scope.twocheckout_sid = $stateParams.twocheckout_sid;
  $scope.is_loading = false;

  $scope.cardNumber = "";
  $scope.cardExpiry = "";
  $scope.cardCvc = "";
  $scope.validForm = true;
  $scope.errorMessageForm = "";
  $scope.card = {
    number: null,
    cvc: null,
    exp_year: null,
    exp_month: null,
    name: null
  }

  $scope.isFormInvalid = function ()
  {
    return !$scope.validForm;
  }

  if (parseInt($scope.gateway_number) === 1) {
    Stripe.setPublishableKey($scope.stripe_pub_key);
  } else {
    //TCO.loadPubKey("sandbox", function() {});​
    //TCO.loadPubKey('sandbox');
    TCO.loadPubKey('production');
  }

  $scope.stripeCallback = function (valid_form)
  {
    if (valid_form) {
      $log.debug('gateway number: ' + $scope.gateway_number)
      $scope.validForm = true;
      $scope.is_loading = true;

      if (parseInt($scope.gateway_number) === 1)
      {
        $log.debug('going with stripe')
        Stripe.createToken({"number": $scope.card.number, 'name': $scope.card.name, 'exp_month': $scope.card.exp_month, 'exp_year': $scope.card.exp_year, 'cvc': $scope.card.cvc}, function (status, response)
        {
          if (status === 200) {
            // check if result ok:
            if (response.id !== undefined && response.object === "token") {

              $http({
                method: 'POST',
                url: Url.get("donation/mobile_view/chargestripe", {value_id: $scope.value_id, amount: $scope.amount_to_donate, currency: $scope.currency, token: response.id}),
                data: {},
                cache: false,
                responseType:'json'
              })
              .success(function (data) {
                $scope.is_loading = false;
                if (data.error === 0 || data.error === "0") {
                  $state.go('donation-confirm', { value_id: $scope.value_id, page_title: $scope.page_title, msg_congrats: $scope.msg_congrats, amount_to_donate: $scope.amount_to_donate, currency: $scope.currency})
                }
                else {
                  $log.debug('error while charging - data recevied :' + JSON.stringify(data))
                  $scope.validForm = false;
                  $scope.is_loading = false;
                  $scope.errorMessageForm = $translate.instant(data.message);
                }
              })
              .catch(function (err) {
                $scope.is_loading = false;
                  $log.debug('error while trying to contact server in order to charge: ' + JSON.stringify(err));
                $scope.validForm = false;
                $scope.errorMessageForm = $translate.instant(err.data.message)
              })
            }
            else {
              $log.debug(JSON.stringify(response));
              $scope.is_loading = false;
              $scope.validForm = false;
              $scope.errorMessageForm = $translate.instant(response.error.message)
            }
          }
          else {
            $log.debug('error status: ' + status);
            $log.debug(JSON.stringify(response));
            $scope.is_loading = false;
            $scope.validForm = false;
            $scope.errorMessageForm = $translate.instant(response.error.message)
          }
        })
      }
      else if (parseInt($scope.gateway_number) === 2) // 2checkout
      {
        $log.debug('going with 2checkout')
        var args = {
          sellerId: $scope.twocheckout_sid,
          publishableKey: $scope.stripe_pub_key,
          ccNo: $scope.card.number,
          cvv: $scope.card.cvc,
          expMonth: $scope.card.exp_month,
          expYear: $scope.card.exp_year
        };
        // Make the token request
        TCO.requestToken(function (success) {
          //$scope.is_loading = false;
          $http({
            method: 'POST',
            url: Url.get("donation/mobile_view/charge2checkout", {value_id: $scope.value_id, amount: $scope.amount_to_donate, currency: $scope.currency, token: success.response.token.token, name: $scope.card.name}),
            data: {},
            cache: false,
            responseType:'json'
          })
          .success(function (data) {
            $scope.is_loading = false;
            if (data.error === 0 || data.error === "0") {
              $state.go('donation-confirm', { value_id: $scope.value_id, page_title: $scope.page_title, msg_congrats: $scope.msg_congrats, amount_to_donate: $scope.amount_to_donate, currency: $scope.currency, name: $scope.card.name})
            }
            else {
              $log.debug('error while charging - data recevied :' + JSON.stringify(data))
              $scope.validForm = false;
              $scope.is_loading = false;
              $scope.errorMessageForm = $translate.instant(data.message);
            }
          })
          .catch(function (err) {
            $scope.is_loading = false;
            $log.debug('error while trying to contact server in order to charge: ' + JSON.stringify(err));
            $scope.validForm = false;
            $scope.errorMessageForm = $translate.instant(err.data.message)
          })
        }, function (err) {
          $scope.is_loading = false;
          $scope.validForm = false;
          $log.debug(err.errorMsg)
          $scope.errorMessageForm = $translate.instant("Connection lost. Please retry again")
        }, args);
      }
    }
    else {
      $log.debug('invalid form');
      $scope.validForm = false;
      $scope.errorMessageForm = $translate.instant("Incomplete form or incorrect data. Please check you correctly typed each field required.")
    }
  }
})
.controller('DonationConfirmController', function ($cordovaGeolocation, $cordovaSocialSharing, $ionicModal, $rootScope, $scope, $state, $stateParams, $timeout, $translate, $window, $http, Application, Customer, OptionsFactory)
{
  $scope.value_id = OptionsFactory.value_id = $stateParams.value_id;
  $scope.msg_congrats = $stateParams.msg_congrats;
  $scope.page_title = $stateParams.page_title;
  $scope.amount_to_donate = $stateParams.amount_to_donate;
  $scope.currency = $stateParams.currency;

  $timeout(function() {
      $state.go('donation-view', {value_id: $scope.value_id})
  }, 5000);
})
