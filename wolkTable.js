(function() {
  'use strict';

	angular
		.module('wolkTable', ['ngMaterial', 'md.data.table']);

	angular
		.module('wolkTable')
		.directive('wolkTable',  tableComponentInject);

	function tableComponentInject() {
		var directive = {
			restrict: 'E',
			templateUrl: '/bower_components/wolk-table/wolkTable.html',
			controller: tableComponentController,
			controllerAs: 'vm',
			scope : {},
			replace: false,
			bindToController : {
				tableConfig : '=',
				tableData : '=',
				tablePromise : '='
			},
			link : function(scope){	
				//  update data on init (sync call)
				if(scope.vm.tableData.length > 0){
					scope.vm.refresh(Object.keys(scope.vm.tableData[0]));
				}
				// update data on http req (asyns call)
				scope.$watch('vm.tableData', function(newData){
					if(scope.vm.tableData.length > 0){
						scope.vm.refresh(Object.keys(scope.vm.tableData[0]));
					}
				});

			}
		};

		return directive;

		/** @ngInject */
		function tableComponentController() {
			var vm = this;
			// list of all column names
			vm.columns = [];

			vm.refresh = function(data){
				vm.columns = data;
			};

		}
	}



})();
