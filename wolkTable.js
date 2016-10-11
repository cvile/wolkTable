(function() {
  'use strict';

	angular
		.module('tableComponent', ['ngMaterial', 'md.data.table']);


	angular
		.module('tableComponent')
		.directive('tableComponent',  tableComponentInject);

	function tableComponentInject() {
		var directive = {
			restrict: 'E',
			templateUrl: 'wolkTable.html',
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
