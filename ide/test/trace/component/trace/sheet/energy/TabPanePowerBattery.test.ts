/*
 * Copyright (C) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-ignore
import { TabPanePowerBattery } from '../../../../../../dist/trace/component/trace/sheet/energy/TabPanePowerBattery.js';
import '../../../../../../dist/trace/component/trace/sheet/energy/TabPanePowerBattery.js';
// @ts-ignore
import { LitTable } from '../../../../../../dist/base-ui/table/lit-table.js';

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
  }));
jest.mock('../../../../../../dist/trace/database/ui-worker/ProcedureWorker.js', () => {
  return {};
});
const sqlit = require('../../../../../../dist/trace/database/SqlLite.js');
jest.mock('../../../../../../dist/trace/database/SqlLite.js');

describe('TabPanePowerBattery Test', () => {
  it('TabPanePowerBatteryTest01', function () {
    document.body.innerHTML = `<lit-table id="tb-power-battery-energy"></lit-table>`;
    let litTable = document.querySelector('#tb-power-battery-energy') as LitTable;
    let tabPanePowerBattery = new TabPanePowerBattery();
    tabPanePowerBattery.tblPower = jest.fn(() => litTable);
    let MockPowerBatteryData = sqlit.getTabPowerBatteryData;
    let battery = [
      {
        ts: 1000,
        eventName: 'POWER_IDE_BATTERY',
        appKey: 'appname',
        eventValue: 'POWER_IDE,POWER_IDE,POWER_IDE,POWER_IDE',
      },
      {
        ts: 1000,
        eventName: 'POWER_IDE_BATTERY',
        appKey: 'appname',
        eventValue: 'POWER_IDE,POWER_IDE,POWER_IDE,POWER_IDE',
      },
    ];
    MockPowerBatteryData.mockResolvedValue(battery);
    let tabPanePowerBatteryData = {
      cpus: [0],
      threadIds: [56],
      trackIds: [9, 4],
      funTids: [42, 1],
      heapIds: [1, 52],
      nativeMemory: [],
      cpuAbilityIds: [88, 10],
      memoryAbilityIds: [11, 69],
      diskAbilityIds: [23, 76],
      networkAbilityIds: [5, 9],
      leftNs: 10225,
      rightNs: 965003,
      hasFps: false,
      statisticsSelectData: undefined,
      perfSampleIds: [75,9,7],
      perfCpus: [],
      perfProcess: [],
      perfThread: [],
      perfAll: true,
      systemEnergy: [0, 1, 2],
      powerEnergy: [45, 8, 2],
      anomalyEnergy: [12, 898, 2],
    };
    tabPanePowerBattery.tblPower.recycleDataSource = jest.fn(() => tabPanePowerBatteryData);
    tabPanePowerBattery.data = tabPanePowerBatteryData;
  });
});
