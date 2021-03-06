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
let templateDiagnosesDetail = require('./diagnoses-detail.html');

class DiagnosesDetailController {
  constructor($scope, $state, $stateParams, $ngRedux, diagnosesActions, serviceRequests, usSpinnerService, serviceFormatted) {
    this.actionLoadList = diagnosesActions.all;
    this.actionLoadDetail = diagnosesActions.get;
    $scope.actionUpdateDetail = diagnosesActions.update;

    usSpinnerService.spin('detail-spinner');
    this.actionLoadDetail($stateParams.patientId, $stateParams.detailsIndex);

    $scope.isEdit = false;
    /* istanbul ignore next */
    this.edit = function () {
      $scope.isEdit = true;
      $scope.diagnosisEdit = Object.assign({}, this.diagnosis);
			$scope.diagnosisEdit.dateCreated = new Date(this.diagnosis.dateCreated);
			$scope.diagnosisEdit.dateOfOnset = new Date(this.diagnosis.dateOfOnset);
      $scope.diagnosisEdit.dateSubmitted = new Date();
    };
    /* istanbul ignore next */
    this.cancelEdit = function () {
      $scope.isEdit = false;
    };
    /* istanbul ignore next */
    $scope.confirmEdit = function (diagnosisForm, diagnosis) {
      $scope.formSubmitted = true;

      let toAdd = {
        code: $scope.diagnosisEdit.code,
        dateOfOnset: serviceFormatted.formattingDate(diagnosis.dateOfOnset, serviceFormatted.formatCollection.YYYYMMDD),
        description: $scope.diagnosisEdit.description,
        problem: $scope.diagnosisEdit.problem,
        source: $scope.diagnosisEdit.source,
        sourceId: $scope.diagnosisEdit.sourceId,
        terminology: $scope.diagnosisEdit.terminology,
				isImport: $scope.diagnosisEdit.isImport || false,
				originalSource: $scope.diagnosisEdit.originalSource || '',
				originalComposition: $scope.diagnosisEdit.originalComposition || ''
      };

      if (diagnosisForm.$valid) {
        $scope.isEdit = false;
        serviceFormatted.propsToString(toAdd, 'isImport');
        $scope.actionUpdateDetail($stateParams.patientId, $scope.diagnosisEdit.sourceId, toAdd);
      }
    }.bind(this);
    
    $scope.UnlockedSources = [
      'handi.ehrscape.com'
    ];

    $scope.formDisabled = true;
    /* istanbul ignore next */
    $scope.isLocked = function (diagnosis) {
      if (!(diagnosis && diagnosis.id)) {
        return true;
      }

      var diagnosisIdSegments = diagnosis.id.toString().split('::');
      if (diagnosisIdSegments.length > 1) {
        return ($scope.UnlockedSources.indexOf(diagnosisIdSegments[1]) < 0);
      }

      return true;
    };
    /* istanbul ignore next */
    this.convertToLabel = function (text) {
      var result = text.replace(/([A-Z])/g, ' $1');
      return result.charAt(0).toUpperCase() + result.slice(1);
    };
    /* istanbul ignore next */
    this.setCurrentPageData = function (store) {
      const state = store.diagnoses;
      const { patientId, detailsIndex } = $stateParams;

      // Get Details data
      if (state.dataGet) {
        this.diagnosis = state.dataGet;
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

const DiagnosesDetailComponent = {
  template: templateDiagnosesDetail,
  controller: DiagnosesDetailController
};

DiagnosesDetailController.$inject = ['$scope', '$state', '$stateParams', '$ngRedux', 'diagnosesActions', 'serviceRequests', 'usSpinnerService', 'serviceFormatted'];
export default DiagnosesDetailComponent;