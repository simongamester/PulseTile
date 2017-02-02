/*
  ~  Copyright 2016 Ripple Foundation C.I.C. Ltd
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
let templateOrdersList = require('./orders-list.html');

class OrdersListController {
  constructor($scope, $state, $stateParams, $ngRedux, ordersActions, serviceRequests, usSpinnerService) {
    serviceRequests.publisher('routeState', {state: $state.router.globals.current.views, breadcrumbs: $state.router.globals.current.breadcrumbs, name: 'patients-details'});
    serviceRequests.publisher('headerTitle', {title: 'Patients Details'});

    this.currentPage = 1;
    this.isShowCreateBtn = $state.router.globals.$current.name !== 'orders-create';
    this.isShowExpandBtn = $state.router.globals.$current.name !== 'orders';

    this.sort = function (field) {
      var reverse = this.reverse;
      if (this.order === field) {
        this.reverse = !reverse;
      } else {
        this.order = field;
        this.reverse = false;
      }
    };

    this.sortClass = function (field) {
      if (this.order === field) {
        return this.reverse ? 'sorted desc' : 'sorted asc';
      }
    };

    this.order = serviceRequests.currentSort.order || 'name';
    this.reverse = serviceRequests.currentSort.reverse || false;

    this.pageChangeHandler = function (newPage) {
      this.currentPage = newPage;
    };

    if ($stateParams.page) {
      this.currentPage = $stateParams.page;
    }

    if ($stateParams.filter) {
      $scope.query = $stateParams.filter;
    }

    this.create = function () {
      $state.go('orders-create', {
        patientId: $stateParams.patientId,
        page: this.currentPage
      });
    };

    this.go = function (id, source) {
      serviceRequests.currentSort.order = this.order;
      serviceRequests.currentSort.reverse = this.reverse;
      
      $state.go('orders-detail', {
        patientId: $stateParams.patientId,
        orderId: id,
        filter: $scope.query,
        page: this.currentPage,
        reportType: $stateParams.reportType,
        searchString: $stateParams.searchString,
        queryType: $stateParams.queryType,
        source: source
      });
    };

    this.setCurrentPageData = function (data) {
      if (data.orders.data) {
        this.orders = data.orders.data;

        for (var i = 0; i < this.orders.length; i++) {
          this.orders[i].orderDate = moment(this.orders[i].orderDate).format('DD-MMM-YYYY h:mm a');
        }
      }
      if (data.patientsGet.data) {
        this.currentPatient = data.patientsGet.data;
        usSpinnerService.stop('patientSummary-spinner');
      }
      if (serviceRequests.currentUserData) {
        this.currentUser = serviceRequests.currentUserData;
      }
    };

    this.selected = function (orderId) {
      return orderId === $stateParams.orderId;
    };

    if ($stateParams.page) {
      this.currentPage = $stateParams.page;
    }

    let unsubscribe = $ngRedux.connect(state => ({
      getStoreData: this.setCurrentPageData(state)
    }))(this);
    
    $scope.$on('$destroy', unsubscribe);
    
    this.ordersLoad = ordersActions.all;
    this.ordersLoad($stateParams.patientId);
  }
}

const OrdersListComponent = {
  template: templateOrdersList,
  controller: OrdersListController
};

OrdersListController.$inject = ['$scope', '$state', '$stateParams', '$ngRedux', 'ordersActions', 'serviceRequests', 'usSpinnerService'];
export default OrdersListComponent;