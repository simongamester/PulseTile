/*
  ~  Copyright 2017 Ripple Foundation C.I.C. Ltd
  ~  
  ~  Licensed under the Apache License, Version 2.0 (the "License");
  ~  you may not use this file except in compliance with the License.
  ~  You may obtain a copy of the License at
  ~  
  ~    http://www.apache.org/licenses/LICENSE-2.0

  ~  Unless required by applicable law or agreed to in writing, software
  ~  distributed under the License is distributed on an "AS IS" BASIS,
  ~  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  ~  See the License for the specific language governing permissions and
  ~  limitations under the License.
*/
let templateProceduresDetail = require('./procedures-detail.html');

class ProceduresDetailController {
  constructor($scope, $state, $stateParams, $ngRedux, proceduresActions, usSpinnerService, serviceRequests, serviceFormatted) {
    this.actionLoadList = proceduresActions.all;
    this.actionLoadDetail = proceduresActions.get;
    $scope.actionUpdateDetail = proceduresActions.update;

    usSpinnerService.spin('detail-spinner');
    this.actionLoadDetail($stateParams.patientId, $stateParams.detailsIndex);

		$scope.isEdit = false;

		this.edit = function () {
			$scope.isEdit = true;

			$scope.procedureEdit = Object.assign({}, this.procedure);
			$scope.procedureEdit.dateSubmitted = new Date();
		};

		this.cancelEdit = function () {
			$scope.isEdit = false;
		};

		$scope.confirmEdit = function (procedureForm) {
			$scope.formSubmitted = true;
			if (procedureForm.$valid) {
				$scope.isEdit = false;

        $scope.procedureEdit.name = $scope.procedureEdit.procedureName;
        serviceFormatted.propsToString($scope.procedureEdit);
        $scope.actionUpdateDetail($stateParams.patientId, this.procedure.sourceId, $scope.procedureEdit);
			}
		}.bind(this);

    this.setCurrentPageData = function (store) {
      const state = store.procedures;
      const { patientId, detailsIndex } = $stateParams;

      // Get Details data
      if (state.dataGet) {
        this.procedure = state.dataGet;
        (detailsIndex === state.dataGet.sourceId) ? usSpinnerService.stop('detail-spinner') : null;
      }

      // Update Detail
      if (state.dataUpdate !== null) {
        // After Update we request all list firstly
        this.actionLoadList(patientId);
      }
      if (state.isUpdateProcess) {
        usSpinnerService.spin('detail-update-spinner');
        if (!state.dataGet && !state.isGetFetching) {
          // We request detail when data is empty
          // Details are cleared after request LoadAll list
          this.actionLoadDetail(patientId, detailsIndex);
        }
      } else {
        usSpinnerService.stop('detail-update-spinner');
      }
      if (serviceRequests.currentUserData) {
        this.currentUser = serviceRequests.currentUserData;
      }

      if (state.error) {
        usSpinnerService.stop('detail-spinner');
        usSpinnerService.stop('detail-update-spinner');
      }
    };

    let unsubscribe = $ngRedux.connect(state => ({
      getStoreData: this.setCurrentPageData(state)
    }))(this);
    $scope.$on('$destroy', unsubscribe);
  }
}

const ProceduresDetailComponent = {
  template: templateProceduresDetail,
  controller: ProceduresDetailController
};

ProceduresDetailController.$inject = ['$scope', '$state', '$stateParams', '$ngRedux', 'proceduresActions', 'usSpinnerService', 'serviceRequests', 'serviceFormatted'];
export default ProceduresDetailComponent;