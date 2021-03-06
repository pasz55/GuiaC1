/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("colors-view", {
            url             : BASE_PATH + "/application/mobile_customization_colors/",
            controller      : "ApplicationColorsController",
            templateUrl     : "templates/application/l1/colors/view.html",
            resolve         : lazyLoadResolver("application"),
            cache           : false
        })
        .state("tc-view", {
            url             : BASE_PATH + "/application/mobile_tc_view/index/tc_id/:tc_id",
            controller      : "ApplicationTcController",
            templateUrl     : "templates/application/l1/tc/view.html",
            resolve         : lazyLoadResolver("application"),
            cache           : false
        });

});;/*global
 angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("booking-view", {
            url             : BASE_PATH + "/booking/mobile_view/index/value_id/:value_id",
            controller      : "BookingController",
            templateUrl     : "templates/booking/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("booking")
        });
});;/*global
 App, angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider, HomepageLayoutProvider) {

    $stateProvider
        .state("catalog-category-list", {
            url             : BASE_PATH + "/catalog/mobile_category_list/index/value_id/:value_id",
            controller      : "CategoryListController",
            templateUrl     : function(param) {
                var layout_id = HomepageLayoutProvider.getLayoutIdForValueId(param.value_id);
                switch(HomepageLayoutProvider.getLayoutIdForValueId(param.value_id)) {
                    case 2:
                        layout_id = "l5";
                        break;
                    case 3:
                        layout_id = "l6";
                        break;
                    default:
                        layout_id = "l3";
                }
                return "templates/html/" + layout_id + "/list.html";
            },
            cache: false,
            resolve: lazyLoadResolver("catalog")
        })
        .state("catalog-product-view", {
            url             : BASE_PATH + "/catalog/mobile_category_product_view/index/value_id/:value_id/product_id/:product_id",
            controller      : "CategoryProductViewController",
            templateUrl     : "templates/catalog/category/l1/product/view.html",
            cache: false,
            resolve: lazyLoadResolver("catalog")
        });

});;/*global
 App, angular, lazyLoadResolver, BASE_PATH, DOMAIN, Message
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("cms-view", {
            url             : BASE_PATH + "/cms/mobile_page_view/index/value_id/:value_id",
            controller      : "CmsViewController",
            templateUrl     : "templates/cms/page/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver(["cms", "places"])
        })
        .state("cms-view-map", {
            url             : BASE_PATH + "/cms/mobile_page_view_map/index/value_id/:value_id/page_id/:page_id/block_id/:block_id",
            params          : {
                page_id: 0
            },
            controller      : "CmsViewMapController",
            templateUrl     : "templates/html/l1/maps.html",
            cache           : false,
            resolve         : lazyLoadResolver(["cms", "places"])
        });

});;/*global
 App, lazyLoadResolver, BASE_PATH, DOMAIN, DEVICE_TYPE
 */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("codescan", {
            url             : BASE_PATH + "/codescan/mobile_view/index/value_id/:value_id",
            controller      : "CodeScanController",
            templateUrl     : "templates/html/l1/loading.html",
            cache           : false,
            resolve         : lazyLoadResolver("codescan")
        });

});;/*global
 App, angular, lazyLoadResolver, BASE_PATH, IMAGE_URL
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("contact-view", {
            url             : BASE_PATH + "/contact/mobile_view/index/value_id/:value_id",
            templateUrl     : "templates/contact/l1/view.html",
            controller      : "ContactViewController",
            cache           : false,
            resolve         : lazyLoadResolver("contact")
        }).state("contact-form", {
            url             : BASE_PATH + "/contact/mobile_form/index/value_id/:value_id",
            templateUrl     : "templates/contact/l1/form.html",
            controller      : "ContactFormController",
            cache           : false,
            resolve         : lazyLoadResolver("contact")
        }).state("contact-map", {
            url             : BASE_PATH + "/contact/mobile_map/index/value_id/:value_id",
            templateUrl     : "templates/html/l1/maps.html",
            controller      : "ContactMapController",
            cache           : false,
            resolve         : lazyLoadResolver("contact")
        });

});;/*global
 App, angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider, HomepageLayoutProvider) {

    $stateProvider
        .state("discount-list", {
            url             : BASE_PATH+"/promotion/mobile_list/index/value_id/:value_id",
            controller      : "DiscountListController",
            cache           : false,
            resolve         : lazyLoadResolver("discount"),
            templateUrl     : function(param) {
                var layout_id = HomepageLayoutProvider.getLayoutIdForValueId(param.value_id);
                switch(layout_id) {
                    case 2:
                        layout_id = "l2";
                        break;
                    case 3:
                        layout_id = "l5";
                        break;
                    case 4:
                        layout_id = "l6";
                        break;
                    default:
                        layout_id = "l3";
                }
                return "templates/html/" + layout_id + "/list.html";
            }
        }).state("discount-view", {
            url             : BASE_PATH+"/promotion/mobile_view/index/value_id/:value_id/promotion_id/:promotion_id",
            controller      : "DiscountViewController",
            templateUrl     : "templates/discount/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("discount")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("event-list", {
            url             : BASE_PATH + "/event/mobile_list/index/value_id/:value_id",
            controller      : "EventListController",
            templateUrl     : "templates/event/l1/list.html",
            cache           : false,
            resolve         : lazyLoadResolver("event")
        }).state("event-view", {
            url             : BASE_PATH + "/event/mobile_view/index/value_id/:value_id/event_id/:event_id",
            controller      : "EventViewController",
            templateUrl     : "templates/event/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("event")
        }).state("event-map", {
            url             : BASE_PATH + "/event/mobile_map/index/value_id/:value_id/event_id/:event_id",
            templateUrl     : "templates/html/l1/maps.html",
            controller      : "EventMapController",
            cache           : false,
            resolve         : lazyLoadResolver("event")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state('facebook-list', {
            url             : BASE_PATH + "/social/mobile_facebook_list/index/value_id/:value_id",
            controller      : 'FacebookListController',
            templateUrl     : "templates/html/l1/list.html",
            resolve         : lazyLoadResolver("facebook"),
            cache           : false,
        }).state('facebook-view', {
            url             : BASE_PATH + "/social/mobile_facebook_view/index/value_id/:value_id/post_id/:post_id",
            controller      : 'FacebookViewController',
            templateUrl     : "templates/facebook/l1/view.html",
            resolve         : lazyLoadResolver("facebook"),
            cache           : false,
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module('starter').config(function ($stateProvider, HomepageLayoutProvider) {
    $stateProvider
        .state('folder-category-list', {
            url: BASE_PATH + '/folder/mobile_list/index/value_id/:value_id',
            controller: 'FolderListController',
            cache: false,
            templateUrl: function (param) {
                var layoutId = HomepageLayoutProvider.getLayoutIdForValueId(param.value_id);
                switch (layoutId) {
                    case 2:
                        layoutId = 'l2';
                        break;
                    case 3:
                        layoutId = 'l3';
                        break;
                    case 4:
                        layoutId = 'l4';
                        break;
                    default:
                        layoutId = 'l1';
                }
                return 'templates/folder/' + layoutId + '/list.html';
            },
            resolve: lazyLoadResolver('folder')
        }).state('folder-subcategory-list', {
            url: BASE_PATH + '/folder/mobile_list/index/value_id/:value_id/category_id/:category_id',
            controller: 'FolderListController',
            cache: false,
            templateUrl: function (param) {
                var layoutId = HomepageLayoutProvider.getLayoutIdForValueId(param.value_id);
                switch (layoutId) {
                    case 2:
                        layoutId = 'l2';
                        break;
                    case 3:
                        layoutId = 'l3';
                        break;
                    case 4:
                        layoutId = 'l4';
                        break;
                    default:
                        layoutId = 'l1';
                }
                return 'templates/folder/' + layoutId + '/list.html';
            },
            resolve: lazyLoadResolver('folder')
        });
});
;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("form-view", {
            url             : BASE_PATH + "/form/mobile_view/index/value_id/:value_id",
            controller      : "FormViewController",
            templateUrl     : "templates/form/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("form")
        });

});;/* global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module('starter').config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('home', {
            url: BASE_PATH,
            templateUrl: 'templates/home/view.html',
            controller: 'HomeController',
            cache: false,
            resolve: lazyLoadResolver('homepage')
            /**onEnter: ['HomepageLayout', '$rootScope', function (HomepageLayout, $ionicNavBarDelegate) {
                $ionicNavBarDelegate.showBar(HomepageLayout.properties.options.autoSelectFirst);
            }]*/
        });

    $urlRouterProvider.otherwise(BASE_PATH);
});
;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("image-list", {
            url             : BASE_PATH + "/media/mobile_gallery_image_list/index/value_id/:value_id",
            templateUrl     : "templates/media/image/l1/list.html",
            controller      : "ImageListController",
            cache           : false,
            resolve         : lazyLoadResolver("image")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("links-view", {
            url             : BASE_PATH + "/weblink/mobile_multi/index/value_id/:value_id",
            controller      : "LinksViewController",
            templateUrl     : "templates/links/l1/view.html",
            code            : "weblink",
            cache           : false,
            resolve         : lazyLoadResolver("links")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("locked", {
            url             : BASE_PATH + "/locked/mobile_view/index",
            controller      : "LockedController",
            templateUrl     : "templates/locked/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("locked")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("loyaltycard-view", {
            url             : BASE_PATH + "/loyaltycard/mobile_view/index/value_id/:value_id",
            cache           : false,
            controller      : "LoyaltyViewController",
            templateUrl     : "templates/loyalty-card/l1/view.html",
            resolve         : lazyLoadResolver("loyalty_card")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("maps-view", {
            url             : BASE_PATH + "/maps/mobile_view/index/value_id/:value_id",
            controller      : "MapsController",
            templateUrl     : "templates/maps/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("maps")
        });

});;/*global
 App, angular, lazyLoadResolver, BASE_PATH
 */

/** CART.JS */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("mcommerce-cart-view", {
            url             : BASE_PATH + "/mcommerce/mobile_cart/index/value_id/:value_id",
            controller      : "MCommerceCartViewController",
            templateUrl     : "templates/mcommerce/l1/cart.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});

/** CATEGORY.JS */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("mcommerce-category-list", {
            url             : BASE_PATH + "/mcommerce/mobile_category/index/value_id/:value_id",
            controller      : "MCommerceListController",
            templateUrl     : "templates/html/l3/list.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        }).state("mcommerce-subcategory-list", {
            url             : BASE_PATH + "/mcommerce/mobile_category/index/value_id/:value_id/category_id/:category_id",
            controller      : "MCommerceListController",
            templateUrl     : "templates/html/l3/list.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        }).state("mcommerce-redirect", {
            url             : BASE_PATH + "/mcommerce/redirect/index/value_id/:value_id",
            controller      : "MCommerceRedirectController",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});

/** PRODUCT.JS */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("mcommerce-product-view", {
            url             : BASE_PATH + "/mcommerce/mobile_product/index/value_id/:value_id/product_id/:product_id",
            controller      : "MCommerceProductViewController",
            templateUrl     : "templates/mcommerce/l1/product.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});

/** SALES/CONFIRMATION.JS */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("mcommerce-sales-confirmation", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_confirmation/index/value_id/:value_id",
            controller      : "MCommerceSalesConfirmationViewController",
            templateUrl     : "templates/mcommerce/l1/sales/confirmation.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        }).state("mcommerce-sales-confirmation-cancel", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_confirmation/cancel/value_id/:value_id",
            controller      : "MCommerceSalesConfirmationCancelController",
            templateUrl     : "templates/mcommerce/l1/sales/confirmation.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        }).state("mcommerce-sales-confirmation-payment", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_confirmation/confirm/token/:token/PayerID/:payerId/value_id/:value_id",
            controller      : "MCommerceSalesConfirmationConfirmPaymentController",
            templateUrl     : "templates/mcommerce/l1/sales/confirmation.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});

/** SALES/CUSTOMER.JS */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("mcommerce-sales-customer", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_customer/index/value_id/:value_id",
            controller      : "MCommerceSalesCustomerViewController",
            templateUrl     : "templates/mcommerce/l1/sales/customer.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});


/** SALES/DELIVERY.JS */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("mcommerce-sales-delivery", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_delivery/index/value_id/:value_id",
            controller      : "MCommerceSalesDeliveryViewController",
            templateUrl     : "templates/mcommerce/l1/sales/delivery.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});

/** SALES/ERROR.JS */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("mcommerce-sales-error", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_error/index/value_id/:value_id",
            controller      : "MCommerceSalesErrorViewController",
            templateUrl     : "templates/mcommerce/l1/sales/error.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});

/** SALES/HISTORY.JS */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("mcommerce-sales-history", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_customer/history/value_id/:value_id",
            controller      : "MCommerceSalesHistoryViewController",
            templateUrl     : "templates/mcommerce/l1/sales/history.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        }).state("mcommerce-sales-history-details", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_customer/history_details/value_id/:value_id/order_id/:order_id",
            controller      : "MCommerceSalesHistoryDetailsController",
            templateUrl     : "templates/mcommerce/l1/sales/history_details.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});

/** SALES/PAYMENT.JS */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("mcommerce-sales-payment", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_payment/index/value_id/:value_id",
            controller      : "MCommerceSalesPaymentViewController",
            templateUrl     : "templates/mcommerce/l1/sales/payment.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});

/** SALES/STORE.JS */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("mcommerce-sales-store", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_storechoice/index/value_id/:value_id",
            controller      : "MCommerceSalesStoreChoiceController",
            templateUrl     : "templates/mcommerce/l1/sales/store.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});

/** SALES/STRIPE.JS */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("mcommerce-sales-stripe", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_stripe/index/value_id/:value_id",
            controller      : "MCommerceSalesStripeViewController",
            templateUrl     : "templates/mcommerce/l1/sales/stripe.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});

/** SALES/SUCCESS.JS */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("mcommerce-sales-success", {
            url             : BASE_PATH + "/mcommerce/mobile_sales_success/index/value_id/:value_id",
            controller      : "MCommerceSalesSuccessViewController",
            templateUrl     : "templates/mcommerce/l1/sales/success.html",
            cache           : false,
            resolve         : lazyLoadResolver("m_commerce")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider.state("media-player", {
        url             : BASE_PATH + "/media/mobile_gallery_music_player/index/value_id/:value_id",
        controller      : "MediaPlayerController",
        templateUrl     : "templates/media/music/l1/player/view.html",
        resolve         : lazyLoadResolver("media")
    });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("music-playlist-list", {
            url             : BASE_PATH + "/media/mobile_gallery_music_playlists/index/value_id/:value_id",
            controller      : "MusicPlaylistsController",
            templateUrl     : "templates/media/music/l1/playlist/list.html",
            cache           : false,
            resolve         : lazyLoadResolver("media")

        }).state("music-playlist-albums", {
            url             : BASE_PATH + "/media/mobile_gallery_music_playlistalbums/index/value_id/:value_id/playlist_id/:playlist_id",
            controller      : "MusicPlaylistAlbumsController",
            templateUrl     : "templates/media/music/l1/playlist/albums.html",
            cache           : false,
            resolve         : lazyLoadResolver("media")

        }).state("music-album-list", {
            url             : BASE_PATH + "/media/mobile_gallery_music_albums/index/value_id/:value_id",
            controller      : "MusicAlbumsListController",
            templateUrl     : "templates/media/music/l1/album/list.html",
            cache           : false,
            resolve         : lazyLoadResolver("media")

        }).state("music-album-view", {
            url             : BASE_PATH + "/media/mobile_gallery_music_album/index/value_id/:value_id/album_id/:album_id",
            controller      : "MusicAlbumViewController",
            templateUrl     : "templates/media/music/l1/album/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("media")

        }).state("music-album-view-track", {
            url             : BASE_PATH + "/media/mobile_gallery_music_album/index/value_id/:value_id/track_id/:track_id",
            controller      : "MusicAlbumViewController",
            templateUrl     : "templates/media/music/l1/album/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("media")

        }).state("music-track-list", {
            url             : BASE_PATH + "/media/mobile_gallery_music_playlisttracks/index/value_id/:value_id/playlist_id/:playlist_id",
            controller      : "MusicTrackListController",
            templateUrl     : "templates/media/music/l1/track/list.html",
            cache           : false,
            resolve         : lazyLoadResolver("media")

        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider, HomepageLayoutProvider) {

    $stateProvider
        .state("newswall-list", {
            url             : BASE_PATH + "/comment/mobile_list/index/value_id/:value_id",
            templateUrl     : function(param) {
                var layout_id = HomepageLayoutProvider.getLayoutIdForValueId(param.value_id);
                switch(layout_id) {
                    case 2:
                        layout_id = "l2";
                        break;
                    case 3:
                        layout_id = "l5";
                        break;
                    case 4:
                        layout_id = "l6";
                        break;
                    default:
                        layout_id = "l1";
                }
                return "templates/html/" + layout_id + "/list.html";
            },
            controller      : "NewswallListController",
            cache           : false,
            resolve         : lazyLoadResolver("newswall")

        }).state("newswall-view", {
            url             : BASE_PATH + "/comment/mobile_view/index/value_id/:value_id/comment_id/:comment_id",
            templateUrl     : "templates/html/l1/view.html",
            controller      : "NewswallViewController",
            cache           : false,
            resolve         : lazyLoadResolver("newswall")

        }).state("newswall-comment", {
            url             : BASE_PATH + "/comment/mobile_comment/index/value_id/:value_id/comment_id/:comment_id",
            templateUrl     : "templates/html/l1/comment.html",
            controller      : "NewswallCommentController",
            cache           : false,
            resolve         : lazyLoadResolver("newswall")

        }).state("fanwall-gallery", {
            url             : BASE_PATH + "/comment/mobile_gallery/index/value_id/:value_id",
            templateUrl     : "templates/fanwall/l1/gallery.html",
            controller      : "NewswallGalleryController",
            cache           : false,
            resolve         : lazyLoadResolver("newswall")

        }).state("fanwall-map", {
            url             : BASE_PATH + "/comment/mobile_map/index/value_id/:value_id",
            templateUrl     : "templates/html/l1/maps.html",
            controller      : "NewswallMapController",
            cache           : false,
            resolve         : lazyLoadResolver("newswall")

        }).state("fanwall-edit", {
            url             : BASE_PATH + "/comment/mobile_edit/value_id/:value_id",
            templateUrl     : "templates/fanwall/l1/edit.html",
            controller      : "NewswallEditController",
            cache           : false,
            resolve         : lazyLoadResolver("newswall")

        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("padlock-view", {
            url             : BASE_PATH + "/padlock/mobile_view/index/value_id/:value_id",
            params          : {
                value_id: 0
            },
            controller      : "PadlockController",
            templateUrl     : "templates/padlock/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("padlock")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("places-list", {
            url             : BASE_PATH + "/places/mobile_list/index/value_id/:value_id",
            controller      : "PlacesListController",
            templateUrl     : "templates/html/l3/list.html",
            cache           : false,
            resolve         : lazyLoadResolver(["cms", "places"])
        }).state("places-list-map", {
            url             : BASE_PATH + "/cms/mobile_list_map/index/value_id/:value_id",
            controller      : "CmsListMapController",
            templateUrl     : "templates/html/l1/maps.html",
            cache           : false,
            resolve         : lazyLoadResolver(["cms", "places"])
        }).state("places-view", {
            url             : BASE_PATH + "/cms/mobile_page_view/index/value_id/:value_id/page_id/:page_id/type/:type",
            controller      : "CmsViewController",
            templateUrl     : "templates/cms/page/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver(["cms", "places"])
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("privacy-policy", {
            url             : BASE_PATH + "/cms/privacy_policy/index/value_id/:value_id",
            controller      : "PrivacyPolicyController",
            templateUrl     : "templates/cms/privacypolicy/l1/privacy-policy.html",
            cache           : false,
            resolve         : lazyLoadResolver("privacy_policy")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("push-list", {
            url             : BASE_PATH + "/push/mobile_list/index/value_id/:value_id",
            controller      : "PushController",
            templateUrl     : "templates/html/l1/list.html",
            cache           : false,
            resolve         : lazyLoadResolver("push")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("radio", {
            url             : BASE_PATH + "/radio/mobile_radio/index/value_id/:value_id",
            controller      : "RadioController",
            templateUrl     : "templates/html/l1/loading.html",
            cache           : false,
            resolve         : lazyLoadResolver(["media", "radio"])
        });

});;/*global
 angular, lazyLoadResolver, BASE_PATH
 */

angular.module("starter").config(function($stateProvider, HomepageLayoutProvider) {

    $stateProvider
        .state("rss-list", {
            url             : BASE_PATH + "/rss/mobile_feed_list/index/value_id/:value_id",
            templateUrl     : function(param) {
                var layout_id = HomepageLayoutProvider.getLayoutIdForValueId(param.value_id);
                switch(layout_id) {
                    case 2:
                        layout_id = "l5";
                        break;
                    case 3:
                        layout_id = "l6";
                        break;
                    default:
                        layout_id = "l3";
                }

                return "templates/html/" + layout_id + "/list.html";
            },
            controller      : "RssListController",
            cache           : false,
            resolve         : lazyLoadResolver("rss")
        }).state("rss-view", {
            url             : BASE_PATH + "/rss/mobile_feed_view/index/value_id/:value_id/feed_id/:feed_id",
            templateUrl     : "templates/rss/l1/view.html",
            controller      : "RssViewController",
            cache           : false,
            resolve         : lazyLoadResolver("rss")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider, HomepageLayoutProvider) {

    $stateProvider
        .state("set-meal-list", {
            url         : BASE_PATH+"/catalog/mobile_setmeal_list/index/value_id/:value_id",
            controller  : "SetMealListController",
            templateUrl : function(param) {
                var layout_id = HomepageLayoutProvider.getLayoutIdForValueId(param.value_id);
                switch(layout_id) {
                    case 2:
                        layout_id = "l5";
                        break;
                    case 3:
                        layout_id = "l6";
                        break;
                    default: // 1
                        layout_id = "l3";
                }
                return "templates/html/" + layout_id + "/list.html";
            },
            resolve         : lazyLoadResolver("catalog")
        }).state("set-meal-view", {
            url         : BASE_PATH+"/catalog/mobile_setmeal_view/index/value_id/:value_id/set_meal_id/:set_meal_id",
            controller  : "SetMealViewController",
            templateUrl : "templates/catalog/setmeal/l1/view.html",
            cache       : false,
            resolve     : lazyLoadResolver("catalog")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("socialgaming-view", {
            url             : BASE_PATH + "/socialgaming/mobile_view/index/value_id/:value_id",
            controller      : "SocialgamingViewController",
            templateUrl     : "templates/socialgaming/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("social_gaming")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("sourcecode-view", {
            url             : BASE_PATH + "/sourcecode/mobile_view/index/value_id/:value_id",
            controller      : "SourcecodeViewController",
            templateUrl     : "templates/sourcecode/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("source_code")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("tip-view", {
            url             : BASE_PATH + "/tip/mobile_view/index/value_id/:value_id",
            controller      : "TipController",
            templateUrl     : "templates/tip/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("tip")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("topic-list", {
            url             : BASE_PATH + "/topic/mobile_list/index/value_id/:value_id",
            controller      : "TopicController",
            templateUrl     : "templates/topic/l1/list.html",
            cache           : false,
            resolve         : lazyLoadResolver("topic")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function ($stateProvider) {

    $stateProvider
        .state("twitter-list", {
            url             : BASE_PATH + "/twitter/mobile_twitter_list/index/value_id/:value_id",
            controller      : "TwitterListController",
            templateUrl     : "templates/twitter/l1/list.html",
            cache           : false,
            resolve         : lazyLoadResolver("twitter")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("video-list", {
            url             : BASE_PATH + "/media/mobile_gallery_video_list/index/value_id/:value_id",
            controller      : "VideoListController",
            templateUrl     : "templates/media/video/l1/list.html",
            cache           : false,
            resolve         : lazyLoadResolver(["youtube", "video"])
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider) {

    $stateProvider
        .state("weather-view", {
            url             : BASE_PATH + "/weather/mobile_view/index/value_id/:value_id",
            controller      : "WeatherController",
            templateUrl     : "templates/weather/l1/view.html",
            cache           : false,
            resolve         : lazyLoadResolver("weather")
        });

});;/*global
    angular, lazyLoadResolver, BASE_PATH
 */
angular.module("starter").config(function($stateProvider, HomepageLayoutProvider) {

    $stateProvider
        .state("wordpress-list", {
            url             : BASE_PATH + "/wordpress/mobile_list/index/value_id/:value_id",
            templateUrl     : function(param) {
                var layout_id = HomepageLayoutProvider.getLayoutIdForValueId(param.value_id);
                switch(layout_id) {
                    case 2:
                        layout_id = "l5";
                        break;
                    case 3:
                        layout_id = "l6";
                        break;
                    default: // 1
                        layout_id = "l3";
                }
                return "templates/html/" + layout_id + "/list.html";
            },
            controller      : "WordpressListController",
            cache           : false,
            resolve         : lazyLoadResolver("wordpress")
        }).state("wordpress-view", {
            url             : BASE_PATH + "/wordpress/mobile_view/index/value_id/:value_id/post_id/:post_id/offset/:offset",
            templateUrl     : "templates/wordpress/l1/view.html",
            controller      : "WordpressViewController",
            cache           : false,
            resolve         : lazyLoadResolver("wordpress")
        });

});