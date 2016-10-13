(function() {
  'use strict';

	angular
		.module('wolkTable', ['ngMaterial', 'md.data.table']);

	angular
		.module('wolkTable')
		.directive('wolkTable',  tableComponentInject);

	angular
		.module('wolkTable')
		.directive('tableResize', tableResizeInject);

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
	};

	function tableResizeInject(){
		return {
	        restrict: 'A',
	        link : function(scope, element, attrs, ctrl){
	        	if(scope.$parent.vm.tableConfig.resize){
	        		scope.$watch('newResize', function() {
		                setTimeout(function(){
		                    // delete all old instances
		                    element.colResizable({
		                        disable : true
		                    });

		                    // create new instance of resize plugin
		                    element.colResizable({
		                    fixed:true,
		                    minWidth : 50,
		                    liveDrag : false,
		                    headerOnly : true,
		                    gripInnerHtml:"<div class='grip'></div>", 
		                    onResize : function(){
		                        var temp = [];
		                        var fullRowWidth = parseInt($("table thead tr").css('width')); //1151

		                        $("table thead tr th").each(function(){
		                            var columnSize = {};
		                            var staticWidth = parseInt($(this).css('width')); // 289
		                            var width = ((100*staticWidth)/fullRowWidth)+"%";
		                            var id = $(this).attr('data-id');
		                            columnSize.columnId = id;
		                            columnSize.columnWidth = width;
		                            temp.push(columnSize);
		                        });

		                        // let controller know that resize is instantiated 
		                        scope.$emit('updateColumnSize', temp);
		                        // cashe new size in local storage for future usage
		                        // CasheData.setLocalStorage("cashe_columnSize", JSON.stringify(temp));
		                    }
		                });    
		                }, 300);
		            }); 
	        	}else{
	        		return false;
	        	}	
	            
	        }
	    };
	};



})();
