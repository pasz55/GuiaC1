/**
 *
 * layout_baguera_10 example
 *
 * All the following functions are required in order for the Layout to work
 */
App.service('layout_baguera_10', function ($rootScope, HomepageLayout) {

    var service = {};

    /**
     * Must return a valid template
     *
     * @returns {string}
     */
    service.getTemplate = function() {
        return "modules/layout/home/layout_baguera_10/view.html";
    };

    /**
     * Must return a valid template
     *
     * @returns {string}
     */
    service.getModalTemplate = function() {
        return "templates/home/l10/modal.html";
    };

    /**
     * onResize is used for css/js callbacks when orientation change
     */
    service.onResize = function() {
        /** Do nothing for this particular one */
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
    service.features = function(features, more_button) {
        /** Place more button at the end */
        if (features.overview.options.length >= 3) {
          // features.overview.options.splice(3, features.overview.options.length);
          features.overview.options.push(more_button);
          // features.overview.options.splice(3, 1, more_button);
        }

        return features;
    };

    return service;

});

App.controller('LayoutBaguera10Controller', ['$scope', function($scope)
{
  var explosivemenuJS = document.createElement('script');
  explosivemenuJS.type = "text/javascript";
  explosivemenuJS.src = "modules/layout/home/layout_baguera_10/explosive-menu.js";
  explosivemenuJS.onload = function() {
    $scope.loadContent();
  };
  document.body.appendChild(explosivemenuJS);
}]);
