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

	angular
		.module('wolkTable')
		.service('defaultConfiguration', defaultConfigurationInject);

	angular
		.module('wolkTable')
		.service('errorHandler', errorHandlerInject);

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
		function tableComponentController($mdDialog) {
			var vm = this;
			// list of all column names
			vm.columns = [];

			vm.refresh = function(data){
				vm.columns = data;
			};

			vm.editRow = function (ev, data) {
				$mdDialog.show({
					controller: DialogController,
					controllerAs : 'vm',
					template: `
						<md-dialog aria-label="edit row"  id="editRowDialogContainer" flex-xs="90" flex-sm="80" flex-md="40" flex-lg="60" flex-xl="20">
							<form name="editRowForm" ng-submit="vm.saveChanges(editRowForm)" novalidate>
								<md-toolbar id="editDialogHeader">
									<div class="md-toolbar-tools">
										<h2>Edit Dialog</h2>
									</div>
								</md-toolbar>

		                      	<md-progress-linear class="md-warn md-hue-1" md-mode="indeterminate" ng-if="vm.showLoader"></md-progress-linear>

									<md-dialog-content id="editDialogBody">
										<div class="md-dialog-content" layout="column">


							                <md-input-container class="md-block" ng-repeat="column in vm.columnDetail">
												<label>{{::column.name || column.id}}</label>
												<input 
													ng-model="vm.data[column.id]" 	
													name="{{::column.id}}"
													ng-minlength="{{::column.validators.minLength || vm.getDefaultValidation(column.type).minLength}}"
													ng-maxlength="{{::column.validators.maxLength || vm.getDefaultValidation(column.type).maxLength}}"
													md-minlength="{{::column.validators.minLength || vm.getDefaultValidation(column.type).minLength}}"
													md-maxlength="{{::column.validators.maxLength || vm.getDefaultValidation(column.type).maxLength}}"
													ng-pattern="{{::column.validators.pattern || vm.getDefaultValidation(column.type).pattern}}"
													type="text">

													<div ng-messages="editRowForm[column.id].$error" layout="column" layout-align="center start" flex ng-messages-multiple>
														<div flex ng-message="minlength">- {{::column.validators.minLengthMsg || vm.getDefaultValidation(column.type).minLengthErrMsg}}</div>
														<div flex ng-message="maxlength">- {{::column.validators.maxLengthMsg || vm.getDefaultValidation(column.type).maxLengthErrMsg}}</div>
														<div flex ng-message="required">- {{::column.validators.requiredMsg || vm.getDefaultValidation(column.type).requiredErrMsg}}</div>
														<div flex ng-message="pattern">- {{::column.validators.patternMsg || vm.getDefaultValidation(column.type).patternErrMsg}}</div>
													</div>
											</md-input-container>

										</div>	
									</md-dialog-content>

								<md-dialog-actions layout="row" id="editDialogFooter">
									<span flex></span>
									<md-button type="submit">
										save
									</md-button>
									<md-button ng-click="vm.cancel()" class="cancelButton">
										cancel
									</md-button>
								</md-dialog-actions>
							</form>
						</md-dialog>
					`,
					targetEvent: ev,
					locals : {
						_data : data,
						_currentScope : this
					},
					clickOutsideToClose:true,
					escapeToClose : true
				});

				function DialogController($mdDialog, $mdToast, _data, _currentScope, defaultConfiguration, errorHandler) {
					var vm = this;

					vm.showLoader = false;
					vm.data = _data;
					vm.columnDetail = [];
					vm.defaultColumnDetail = [];
					vm.model = {};			


					var tableConfig = _currentScope.tableConfig;

					vm.getDefaultValidation = function(_type){
						return defaultConfiguration.getDefaultValidation(_type);
					};


					// vm.columnDetail EXAMPLE
					/*
						vm.columnDetail = [{
							id : "id",
							name : "id",
							validators : {
								required : true,
								requiredMsg : "This field is required",
								minLength : true,
								minLengthRule : 0,
								minLengthMsg : "Minimum value for input field",
								maxLength : true,
								maxLengthRule : 30,
								maxLengthMsg : "Maximum input characters ... "
							}		
						}] ...
					*/

					// vm.validators = {};

					var getValidatorRule = function(_columnId, _validatorId){
						for(var i=0; i < vm.columnDetail.length; i++){
							if(vm.columnDetail[i].id === _columnId){
								for(var j=0; j < vm.columnDetail[i].validators.length; j++){
									return vm.columnDetail[i].validators[j].validatorRule;
								}
							}
						}
					};

					var getColumnPropertiesById = function(_id){
						var temp = {};
						if(typeof tableConfig.columns !== 'undefined'){
							for(var i=0; i < tableConfig.columns.length; i++){
								if(tableConfig.columns[i].id === _id){
									temp['name'] = tableConfig.columns[i].name;
									temp['type'] = tableConfig.columns[i].type;
									temp['validators'] = [];
									temp.validators = tableConfig.columns[i].validators || [];
								}
							}
							return temp;
						}else{	
							// show warning messages
							errorHandler.showWarningMsg('Columns property is not defined, wolkTable will continue to use object keys for mapping.');
							errorHandler.showWarningMsg('Note - If you dont define column types [number, text, date or money], all columns will be interpreted as strings');
							errorHandler.showWarningMsg('Note - For fields validation and translations, use columns property to describe data columns');
							return false;
						}
					};

					var addValidationsToData = function (data){

						for(var key in data){

							var columnProperties = getColumnPropertiesById(key);

							if(columnProperties){

								var temp = {}

								temp['id'] = key || null;
								temp['name'] = columnProperties.name || null;
								temp['type'] = columnProperties.type || null;
								temp['validators'] = {};
									
								if(Object.keys(columnProperties).length !== 0){
									for(var j=0; j < columnProperties.validators.length; j++){
										temp.validators[columnProperties.validators[j].validatorName] = columnProperties.validators[j].validatorRule;	
									}
									
									vm.columnDetail.push(temp);
								}
							}else{
								// return default data
								var temp = {};
								
								temp['id'] = key;
								temp['name'] = key;
								temp['type'] = 'text';
								temp['validators'] = defaultConfiguration.getDefaultValidation('text');

								vm.columnDetail.push(temp);
							}
						}
					};

					var init = function(){
						addValidationsToData(_data);
					};

					init();

					vm.saveChanges = function(){
						// callback from outside
						vm.showLoader = true;
						_currentScope.tableConfig.rowEdit.rowEditCallback(vm.data).then(function(){
							vm.showLoader = false;

							$mdToast.show(
						      $mdToast.simple()
						        .textContent('Successfuly updated data!')
						        .position('top right')
						        .hideDelay(3000)
						        .parent('#editRowDialogContainer')
						        .toastClass('editDialogToastMsg')
						    );
						});
					};

					vm.cancel = function(){
						$mdDialog.cancel();
					};
				} 
		    };

		    vm.deleteRow = function(ev, _selectedItems){
				var confirm = $mdDialog.confirm()
					.title('Delete Confirmation')
					.textContent('Are you sure you want to delete ? All row data will be lost')
					.ariaLabel('Table row delete dialog')
					.targetEvent(ev)
					.ok('Delete')
					.cancel('Cancel');

				$mdDialog.show(confirm).then(function() {
					
					if(_selectedItems.length > 1){
						// delete many
						vm.tableConfig.multipleSelection.deleteRowsCallback(_selectedItems).then(function(){
							console.log("you successfuly deleted multiple items");
						});
					}else{
						// delete one
						vm.tableConfig.rowDelete.deleteCallback().then(function(){
							console.log("you successfuly deleted one row");
						});
					}
					// remove deleted ones from [selected]

					// remove deleted ones from data array (table)

				}, function() {
					console.log("you canceled delete event");
				});
		    };

		};
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

		                        // let controller know that resize is instantiated je
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

	function defaultConfigurationInject(){
		var that = this;

		this.getDefaultValidation = function(_inputType){
			
			switch(_inputType){ // number, text, date, money
				case 'number':
					return {
						minLength : 1,
						minLengthErrMsg : 'Number should be at least 2 digit long',
						maxLength : 10,
						maxLengthErrMsg : 'Number cannot be more then 10 digit long',
						pattern : '',
						patternErrMsg : 'This should never happen !xD'
					};
					break;
				case 'text':
					return {
						minLength : 5,
						minLengthErrMsg : 'Text should be at least 5 character long',
						maxLength : 25,
						maxLengthErrMsg : 'Text cannot be more then 25 characters',
						pattern : '',
						patternErrMsg : 'This should never happen !xD'
					};
					break;
				case 'date':
					//
					break;
				case 'money':
					//
					break;
			}
		};

		this.getDefaultColumnPropertiesById = function(_id){
			// temp['name'] = tableConfig.columns[i].name;
			// temp['type'] = tableConfig.columns[i].type;
			// temp['validators'] = [];
			// temp.validators = tableConfig.columns[i].validators || [];

			return {
				name : "",
				type : "",
				validators : []
			};
		};
	};

	function errorHandlerInject(){
		console.clear()
		this.showWarningMsg = function(_msg){
			console.warn(_msg);
		}

		this.showErrorMsg = function(_msg){
			console.error(_msg);
		}

	};



})();
