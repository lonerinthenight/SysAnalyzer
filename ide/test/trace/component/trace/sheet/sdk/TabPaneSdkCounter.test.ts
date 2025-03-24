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
import { TabPaneSdkCounter } from '../../../../../../dist/trace/component/trace/sheet/sdk/TabPaneSdkCounter.js';
// @ts-ignore
import '../../../../../../dist/trace/component/trace/sheet/sdk/TabPaneSdkCounter.js';
// @ts-ignore
import { SpSystemTrace } from '../../../../../../dist/trace/component/SpSystemTrace.js';

// @ts-ignore
import { LitTable } from '../../../../../../dist/base-ui/table/lit-table.js';
// @ts-ignore
import {TabUtil} from "../../../../../../dist/trace/component/trace/sheet/sdk/TabUtil.js";

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

const sqlite = require('../../../../../../dist/trace/database/SqlLite.js');
jest.mock('../../../../../../dist/trace/database/SqlLite.js');

describe('TabPaneSdkCounter Test', () => {
  document.body.innerHTML = `<lit-table id="tb-counter"></lit-table>`;
  let litTable = document.querySelector('#tb-counter') as LitTable;
  it('TabPaneSdkCounterTest00', () => {
    let tabPaneSdkCounter = new TabPaneSdkCounter();
    tabPaneSdkCounter.tblSdkCounter = jest.fn(() => litTable);
    let a = new Map();
    let jsonCofigStr =
      '{"settingConfig":{"configuration":{"counters":{"enum":["ARM_Mali-TTRx_JS1_ACTIVE","ARM_Mali-TTRx_JS0_ACTIVE","ARM_Mali-TTRx_GPU_ACTIVE","ARM_Mali-TTRx_FRAG_ACTIVE"],\n' +
      '    "type":"string"},"stop_gator":{"default":"true","description":"stop_gator","type":"boolean"},"version":{"default":"1","description":"gatordversion","type":"number"}},"name":"mailG77"},\n' +
      '    "tableConfig":{"showType":[{"columns":[{"column":"ts","displayName":"TimeStamp","showType":[1,3],"type":"INTEGER"},{"column":"counter_id","displayName":"MonitorValue","showType":[1,3],"type":"INTEGER"},\n' +
      '    {"column":"value","displayName":"Value","showType":[1,3],"type":"INTEGER"}],"inner":{"columns":[{"column":"counter_name","displayName":"","showType":[0],"type":"STRING"},\n' +
      '    {"column":"counter_id","displayName":"","showType":[0],"type":"INTEGER"}],"tableName":"mock_plugin_counterobj_table"},"tableName":"mock_plugin_counter_table"},\n' +
      '    {"columns":[{"column":"start_ts","displayName":"startts","showType":[2,3],"type":"INTEGER"},{"column":"end_ts","displayName":"endts","showType":[2,3],"type":"INTEGER"},\n' +
      '    {"column":"slice_id","displayName":"slice_id","showType":[2,3],"type":"INTEGER"},{"column":"value","displayName":"Value","showType":[2,3],"type":"INTEGER"}],\n' +
      '    "inner":{"columns":[{"column":"slice_name","displayName":"","showType":[0],"type":"STRING"},{"column":"slice_id","displayName":"","showType":[0],"type":"INTEGER"}],\n' +
      '    "tableName":"mock_plugin_sliceobj_table"},"tableName":"mock_plugin_slice_table"}]}}';
    let datamap = {
      jsonConfig: jsonCofigStr,
      disPlayName: 'common_mock',
      pluginName: 'mock-plugin',
    };
    a.set(1, datamap);
    SpSystemTrace.SDK_CONFIG_MAP = a;
    let startTime = sqlite.queryStartTime;
    let dataTime: Array<any> = [
      {
        start_ts: 1000,
      },
    ];
    startTime.mockResolvedValue(dataTime);

    let tabSdkCounterLeftData = sqlite.getTabSdkCounterLeftData;
    let data = [
      {
        max_value: 1000,
      },
      {
        max_value: 2000,
      },
      {
        max_value: 3000,
      },
    ];
    tabSdkCounterLeftData.mockResolvedValue(data);

    let tabSdkCounterData = sqlite.getTabSdkCounterData;
    let counter = [
      {
        ts: 1000,
        counter_id: 0,
        value: 100,
      },
      {
        ts: 2000,
        counter_id: 0,
        value: 100,
      },
      {
        ts: 3000,
        counter_id: 0,
        value: 100,
      },
      {
        ts: 4000,
        counter_id: 0,
        value: 100,
      },
      {
        ts: 5000,
        counter_id: 0,
        value: 100,
      },
    ];
    tabSdkCounterData.mockResolvedValue(counter);

    let d = {
      cpus: [45,1],
      threadIds: [],
      trackIds: [45,1,22],
      funTids: [],
      heapIds: [78,7],
      nativeMemory: [],
      cpuAbilityIds: [41,1],
      memoryAbilityIds: [],
      diskAbilityIds: [45,5],
      networkAbilityIds: [],
      leftNs: 23,
      rightNs: 67,
      hasFps: false,
      statisticsSelectData: [],
      perfSampleIds: [145,56,6],
      perfCpus: [3],
      perfProcess: [],
      perfThread: [],
      perfAll: false,
      sdkCounterIds: ['a-1', 'b-1', 'd-1'],
    };
    tabPaneSdkCounter.tblSdkCounter.recycleDataSource = jest.fn(() => d);
    tabPaneSdkCounter.tblSdkCounter.appendChild = jest.fn(() => true);
    tabPaneSdkCounter.data = d;
    expect(tabPaneSdkCounter.data).toBeUndefined();
  });

  it('TabPaneSdkCounterTest01', () => {
    let tabPaneSdkCounter = new TabPaneSdkCounter();
    expect(tabPaneSdkCounter.parseJson(new Map())).toBe('');
  });

  it('TabPaneSdkCounterTest02', () => {
    let tabPaneSdkCounter = new TabPaneSdkCounter();
    let type = {
      columns: [{ showType: 'counter' }],
    };
    expect(TabUtil.getTableType(type)).toBe('');
  });

  it('TabPaneSdkCounterTest03', () => {
    let tabPaneSdkCounter = new TabPaneSdkCounter();
    expect(tabPaneSdkCounter.initDataElement()).toBeUndefined();
  });


  it('TabPaneSdkCounterTest04', function () {
    let tabPaneSdkCounter = new TabPaneSdkCounter();
    tabPaneSdkCounter.tblSdkCounter = jest.fn(() => true);
    tabPaneSdkCounter.tblSdkCounter!.recycleDataSource = jest.fn(() => true);
    expect(
      tabPaneSdkCounter.sortByColumn({
        key: '',
        sort: '',
      })
    ).toBeUndefined();
  });
});
