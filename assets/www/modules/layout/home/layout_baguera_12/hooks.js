/**
 *
 * layout_baguera_12 homepage hook
 *
 * All the following functions are required in order for the Layout to work
 */
App.service('layout_baguera_12', function ($rootScope, $timeout, $state, $ionicHistory, HomepageLayout) {

    var service = {};

    /**
     * Must return a valid template
     *
     * @returns {string}
     */
    service.getTemplate = function() {
        return "modules/layout/home/layout_baguera_12/view.html";
    };

    /**
     * Must return a valid template
     *
     * @returns {string}
     */
    service.getModalTemplate = function () {
        return "modules/layout/home/layout_baguera_12/modal.html";
    };

    /**
     * onResize is used for css/js callbacks when orientation change
     */
    service.onResize = function () {

    };

    /**
     * Manipulate the features objects
     *
     * Examples:
     * - you can re-order features
     * - you can push/place the "more_button"
     *
     * @param features
     * @param more_button
     * @returns {*}
     */
    service.features = function (features, more_button) {
      var _features = features;

      // remove my account from menu
      _features.overview.options = _features.overview.options.filter(function (el) {
        return el.code !== 'tabbar_account'
      })
      _features.options = _features.options.filter(function (el) {
        return el.code !== 'tabbar_account'
      })

      if (_features.overview.options.length === 3) {
        _features.overview.options.push(more_button);
      }
      return _features;
    };

    return service;

});

App.controller('LayoutBagueraConnectHomepageCtrl', function($cordovaCamera, $cordovaOauth, $ionicActionSheet, $ionicLoading, $ionicPopup, $ionicScrollDelegate, $q, $rootScope, $scope, $log, $timeout, $translate, $window, Application, Customer, Dialog, FacebookConnect, SafePopups, HomepageLayout)
{
  var WavesJS = document.createElement('script') // visual effet on touch
  WavesJS.type = "text/javascript"
  WavesJS.src = "modules/layout/home/layout_baguera_12/waves-effect.js"
  WavesJS.onload = function () {
    $scope.loadContent()
  }
  document.body.appendChild(WavesJS)

  $scope.is_connected = false
  $scope.display_login_form = false
  $scope.display_account_form = false
  $scope.display_forgot_password_form = false
  $scope.display_privacy_policy = false
  $scope.display_edit_form = false
  $scope.customer = {}
  $scope.is_loading = false
  $scope.is_logged_in = Customer.isLoggedIn()
  $scope.can_connect_with_facebook = !!Customer.can_connect_with_facebook
  $scope.avatar_url = null
  $scope.has_avatar = false
  $scope.show_avatar = true;
  $scope.avatar_loaded = false;

  $scope.getBgOpacity = function (hex, opacity) {
    hex = hex.replace('#', '')
    var r = parseInt(hex.substring(0, 2), 16)
    var g = parseInt(hex.substring(2, 4), 16)
    var b = parseInt(hex.substring(4, 6), 16)
    opacity = opacity > 1 ? (opacity / 100) : opacity

    return 'background-color: rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ');'
  }

  $scope.bgBtnColorStyle = 'background-color: rgba(254, 254, 254, 0.1);'
  HomepageLayout.getFeatures().then(function (features) {
    $scope.bgBtnColorStyle = $scope.getBgOpacity(features.layoutOptions.bgColor, features.layoutOptions.bgOpacity)
  })

  $scope.hideAvatar = function () {
    $scope.show_avatar = false
  }

  $scope.avatarLoaded = function () {
    $scope.avatar_loaded = true
    $scope.show_avatar = true
  }

  $scope.clickOnEdit = function () {
    $scope.display_edit_form = true
    $scope.display_account_form = false
    $scope.display_forgot_password_form = false
  }

  $scope.clickOnConnexion = function () {
    $scope.display_login_form = true
    $scope.display_account_form = false
    $scope.display_forgot_password_form = false
  }

  $scope.clickOnForgot = function () {
    $scope.display_login_form = false
    $scope.display_forgot_password_form = true
    $scope.is_loading = false
  }

  $scope.clickOnAbort = function () {
    $scope.display_login_form = false
    $scope.display_account_form = false
    $scope.display_forgot_password_form = false
  }

  $scope.clickOnAbortEdit = function () {
    $scope.display_edit_form = false
    $scope.display_account_form = false
    $scope.display_login_form = false
    $scope.display_forgot_password_form = false
  }

  $scope.clickOnPrivacyPolicy = function () {
    $scope.display_privacy_policy = true
  };

  $scope.clickOnBackPolicy = function () {
    $scope.display_privacy_policy = false
  }

  $scope.clickOnlogout = function () {
    $scope.is_loading = true
    Customer.logout()
    .success(function(data) {
      FacebookConnect.logout()
      $scope.is_loading = false
      if(data.success) {
        $scope.is_logged_in = false
      }
    })
    .finally(function () {
      $scope.is_loading = false
      $scope.display_login_form = true
      $scope.display_account_form = false
      $scope.display_forgot_password_form = false
    })
  }

  $scope.clickOnCreateAccount = function () {
    $scope.display_login_form = false
    $scope.display_account_form = true
    $scope.display_forgot_password_form = false
  }

  $scope.loginSubmit = function () {
    $scope.is_loading = true
    Customer.login($scope.customer)
    .success(function (data) {
      if(data && data.success) {
        Customer.find()
        .success(function (customer) {
          $scope.customer = customer;
          $scope.is_logged_in = true
          $scope.loadContent()
        })
        .finally(function () {
          $scope.is_loading = false
        })
      }
    })
    .error(function (data) {
      $scope.is_loading = false
      if(data && angular.isDefined(data.message)) {
        Dialog.alert($translate.instant("Error"), data.message, $translate.instant("OK"))
      }
    })
  }

  $scope.editAccountSubmit = function () {
    $scope.is_loading = true
    Customer.save($scope.customer)
    .success(function (data) {
      if(angular.isDefined(data.message)) {
        Dialog.alert("", data.message, $translate.instant("OK"))
      }

      if(data.success) {
        $scope.display_edit_form = false
      }
    })
    .error(function (data) {
      if(data && angular.isDefined(data.message)) {
        Dialog.alert($translate.instant("Error"), data.message, $translate.instant("OK"))
      }
    })
    .finally(function () {
      $scope.is_loading = false
      $ionicLoading.hide()
    });
  }

  $scope.forgotPasswordSubmit = function () {
    $scope.is_loading = true
    Customer.forgottenpassword($scope.customer.email)
    .success(function (data) {
      if (data && angular.isDefined(data.message)) {
        Dialog.alert("", data.message, $translate.instant("OK"))

        if (data.success) {
          $scope.display_forgot_password_form = false
          $scope.display_login_form = true
        }
      }
    })
    .error(function (data) {
      if (data && angular.isDefined(data.message)) {
        Dialog.alert($translate.instant("Error"), data.message, $translate.instant("OK"))
      }
    })
    .finally(function () {
      $scope.is_loading = false
    })
  }

  $scope.loginWithFacebook = function() {
    if((typeof IS_PREVIEWER !== 'undefined' && angular.isDefined(IS_PREVIEWER)) || $rootScope.isOverview || Application.is_webview) {
      $rootScope.showMobileFeatureOnlyError()
      return
    }
    FacebookConnect.login()
  }

  $scope.registerSubmit = function () {
    $scope.is_loading = true
    Customer.save($scope.customer)
    .success(function (data) {
      if(angular.isDefined(data.message)) {
        Dialog.alert("", data.message, $translate.instant("OK"))
      }
      if(data.success) {
        $scope.display_login_form = false
        $scope.display_account_form = false
        $scope.display_forgot_password_form = false
        $scope.is_logged_in = true
        $scope.loginSubmit()
      }
    })
    .error(function (data) {
      if(data && angular.isDefined(data.message)) {
        Dialog.alert($translate.instant("Error"), data.message, $translate.instant("OK"))
      }
    })
    .finally(function () {
      $scope.is_loading = false
    });
  }

  $scope.loadContent = function () {
    if(!$scope.is_logged_in) return

    Customer.find()
    .success(function (customer) {
      $scope.customer = customer;
      $scope.customer.metadatas = _.isObject($scope.customer.metadatas) ? $scope.customer.metadatas : {}
      $scope.avatar_url = Customer.getAvatarUrl($scope.customer.id);
    })
    .then(function ()
    {
      return HomepageLayout.getActiveOptions()
      .then(function (options) {
        $scope.optional_fields = {
          ranking: !!_.find(options, {"use_ranking": "1"}),
          nickname: !!_.find(options, {"use_nickname": "1"})
        }
        $scope.custom_fields = []

        _.forEach(options, function (opt) {
          var fields = _.get(opt, "custom_fields")

          if(_.isArray(fields) && fields.length > 0) {
            $scope.custom_fields.push(_.pick(opt, ["name", "code", "custom_fields"])) // We keep a small copy of the option
            _.forEach(fields, function(field) {
              var mpath =  opt.code+"."+field.key
              _.set(  // We create metadata with default value if it doesn't exist
                $scope.customer.metadatas,
                mpath,
                _.get($scope.customer.metadatas, mpath, (field.default || null))
              )
            })
          }
        })
      })
    })
    .finally(function () {
      $scope.has_avatar = true
      $scope.display_login_form = false
      $scope.is_logged_in = true
      $scope.is_loading = false
    });
  };

  $scope.has_loggin_features = false


  $scope.editAvatar = function() {
    var buttons = [
      { text: $translate.instant("Edit") }
    ]

    if($scope.customer.avatar != null) {
      var text = "Cancel "+($scope.customer.delete_avatar ? "delete" : "edit")
      buttons.push({ text: $translate.instant(text) })
    } else {
      if($scope.customer.is_custom_image) {
        buttons.push({ text: $translate.instant("Delete") })
      }
    }

    var hideSheet = $ionicActionSheet.show({
      buttons: buttons,
      cancelText: $translate.instant("Cancel"),
      cancel: function() {
        hideSheet()
      },
      buttonClicked: function(index) {
        if(index == 0) {
          // We have to use timeout, if we do not,
          // next action sheet will loose focus after 400ms
          // because of the closing one. For more details,
          // see this : https://github.com/driftyco/ionic/blob/1.x/js/angular/service/actionSheet.js#L138
          $timeout($scope.takePicture, 600)
        }
        if(index == 1) {
          if($scope.customer.avatar != null) {
            // Cancel edit/delete :
            $scope.customer.avatar = null
            $scope.customer.delete_avatar = false
            $scope.avatar_url = Customer.getAvatarUrl($scope.customer.id)
          } else {
            $scope.customer.avatar = false
            $scope.customer.delete_avatar = true
            $scope.avatar_url = Customer.getAvatarUrl($scope.customer.id, {ignore_stored: true})
          }
        }
        return true;
      }
    })
  }

  $scope.takePicture = function(field) {
    var gotImage = function(image_url) {
      // TODO: move all picture taking and cropping modal
      // into a dedicated service for consistence against modules
      $scope.cropModal = {original: image_url, result: null};

      // DO NOT REMOVE popupShowing !!!
      // img-crop directive doesn't work if it has been loaded off screen
      // We show the popup, then switch popupShowing to true, to add
      // img-crop in the view.
      $scope.popupShowing = false;
      $ionicPopup.show({
        template: '<div style="position: absolute" class="cropper"><img-crop ng-if="popupShowing" image="cropModal.original" result-image="cropModal.result" area-type="square" result-image-size="256" result-image-format="image/jpeg" result-image-quality="0.9"></img-crop></div>',
        cssClass: 'avatar-crop',
        scope: $scope,
        buttons: [{
          text: $translate.instant('Cancel'),
          type: 'button-default',
          onTap: function(e) {
            return false;
          }
        },
        {
          text: $translate.instant('OK'),
          type: 'button-positive',
          onTap: function(e) {
            return true;
          }
        }]
      })
      .then(function(result) {
        if(result) {
          $scope.cropModalCtrl = null;
          $scope.avatar_url = $scope.cropModal.result;
          $scope.customer.avatar = $scope.cropModal.result;
          $scope.customer.delete_avatar = false;
        }
      });
      $scope.popupShowing = true;
    };

    var gotError = function(err) {
      // An error occured. Show a message to the user
    };

    if(Application.is_webview) {
      var input = angular.element("<input type='file' accept='image/*'>");
      var selectedFile = function(evt) {
          var file=evt.currentTarget.files[0];
          var reader = new FileReader();
          reader.onload = function (evt) {
              gotImage(evt.target.result);
              input.off("change", selectedFile);
          };
          reader.onerror = gotError;
          reader.readAsDataURL(file);
      };
      input.on("change", selectedFile);
      input[0].click();
    } else {
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
            targetWidth: 256,
            targetHeight: 256,
            correctOrientation: true,
            popoverOptions: CameraPopoverOptions,
            saveToPhotoAlbum: false
          };

          $cordovaCamera.getPicture(options)
          .then(function(imageData) {
            gotImage("data:image/jpeg;base64," + imageData);
          }, gotError);

          return true;
        }
      });
    }
  };

  $rootScope.$on('auth-login-status-changed', function () {
    $scope.is_loading = true
    HomepageLayout.getFeatures()
    .then(function (features) {
      // $scope.features = features
      $scope.has_loggin_features = true
      var _features = features;

      // _features.overview.options = _features.overview.options.filter(function (el) {
      _features.options = _features.options.filter(function (el) {
        return el.code !== 'tabbar_account'
      })
      $scope.loggin_features = _features
    })
    Customer.find()
    .success(function (customer) {
      $scope.customer = customer;
      $scope.customer.metadatas = _.isObject($scope.customer.metadatas) ? $scope.customer.metadatas : {}
      $scope.avatar_url = Customer.getAvatarUrl($scope.customer.id);
      $scope.has_avatar = true
    })
    .finally(function () {
      $scope.is_loading = false
    })
  })

  $scope.loadContent()
});
