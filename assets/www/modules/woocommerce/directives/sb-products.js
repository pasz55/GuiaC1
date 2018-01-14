App.directive("sbProducts", function($translate) {
    return {
        restrict: 'EA',
        scope: {
            products: '=',
            valueId: '='
        },
        template:'<div ng-repeat="product in products">' +
                    '<div class="row" ng-if="$even">' +
                        '<div class="col col-50" ng-click="showProduct(products[$index])">' +
                            '<div class="card">' +
                                '<a class="product-title  text-center" ng-href="">' +
                                    '<div class="sale-badge" ng-if="products[$index].on_sale">' +
                                        '<i class="icon ion-bookmark"></i>' +
                                    '</div>' +
                                    '<div class="out-of-stock" ng-if="!products[$index].in_stock">' +
                                        $translate.instant("Out of stock") +
                                    '</div>' +
                                    '<img ng-if="products[$index].images[0].src" ng-src="{{products[$index].images[0].src}}" class="full-image"/>' +
                                    '<h5 class="product-name">{{products[$index].name}}</h5>' +
                                '</a>' +
                                '<div ng-if="products[$index].price_html" class="text-right product-price">' +
                                    '<i class="icon ion-pricetag"></i>' +
                                    '<span class="" ng-bind-html="products[$index].price_html"></span>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="col col-50" ng-click="showProduct(products[$index+1])" ng-if="products[$index+1]">' +
                            '<div class="card">' +
                                '<a class="product-title  text-center" ng-href="">' +
                                    '<div class="sale-badge" ng-if="products[$index+1].on_sale">' +
                                        '<i class="icon ion-bookmark"></i>' +
                                    '</div>' +
                                    '<div class="out-of-stock" ng-if="!products[$index+1].in_stock">' +
                                        $translate.instant("Out of stock") +
                                    '</div>' +
                                    '<img ng-if="products[$index+1].images[0].src" ng-src="{{products[$index+1].images[0].src}}" class="full-image"/>' +
                                    '<h5 class="product-name">{{products[$index+1].name}}</h5>' +
                                '</a>' +
                                '<div ng-if="products[$index+1].price_html" class="text-right product-price">' +
                                    '<i class="icon ion-pricetag"></i>' +
                                    '<span class="" ng-bind-html="products[$index+1].price_html"></span>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>',
        controller: function($scope, $state) {
            $scope.showProduct = function(product) {
                if(product.grouped_products.length) {
                    $state.go("woocommerce-grouped-products", {value_id: $scope.valueId, parent_id: product.id});
                } else {
                    $state.go("woocommerce-product", {value_id: $scope.valueId, product_id: product.id});
                }
            };
        }
    }
});