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

import crypto from 'crypto';
// @ts-ignore
import { TabPaneNMStatisticAnalysis } from '../../../../../../dist/trace/component/trace/sheet/native-memory/TabPaneNMStatisticAnalysis.js';
// @ts-ignore
import { LitTable } from '../../../../../../dist/base-ui/table/lit-table.js';

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

jest.mock('../../../../../../dist/base-ui/table/lit-table.js', () => {
  return {};
});

Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: (arr: string | any[]) => crypto.randomBytes(arr.length),
  },
});

jest.mock('../../../../../../dist/base-ui/chart/pie/LitChartPie.js', () => {
  return {};
});

jest.mock('../../../../../../dist/js-heap/model/DatabaseStruct.js', () => {});

describe('TabPaneNMStatisticAnalysis Test', () => {
  let htmlDivElement = document.createElement('div');
  let tabStatisticAnalysis = new TabPaneNMStatisticAnalysis();
  tabStatisticAnalysis.tableType.reMeauseHeight = jest.fn(() => true);
  tabStatisticAnalysis.soUsageTbl.reMeauseHeight = jest.fn(() => true);
  tabStatisticAnalysis.functionUsageTbl.reMeauseHeight = jest.fn(() => true);
  htmlDivElement.append(tabStatisticAnalysis);
  let dataArray = {
    applyCount: 25336,
    applyCountPercent: '99',
    applySize: 13372754,
    applySizeFormat: '12.75MB',
    applySizePercent: '25023.87',
    existCount: 1011,
    existCountPercent: '98.54',
    existSize: 809825,
    existSizeFormat: '790.84KB',
    existSizePercent: '2.36',
    releaseCount: 52168,
    releaseCountPercent: '99.53',
    releaseSize: 12562929,
    releaseSizeFormat: '11.98MB',
    releaseSizePercent: '1.79',
    tableName: 'Test',
    typeId: 0,
    typeName: 'Test',
  };
  let select = {
    recordStartNs: 8406282873525,
    leftNs: 16648778040,
    rightNs: 48320174407,
    hasFps: false,
    nativeMemory: ['All Heap & Anonymous VM', 'All Heap'],
  };
  let processData = [
    {
      applyId: 215,
      callChainId: 11,
      count: 31,
      endTs: 498010,
      id: 2095,
      libId: 220,
      libName: '[ld-musl-arm.so.1+0xbd94f] ld-musl-arm.so.1',
      pid: 1,
      size: 304,
      startTs: 421203,
      symbolId: 201,
      symbolName: '[ld-musl-arm.so.1+0xbd94f]',
      tid: 2011,
      type: 130,
    },
  ];
  tabStatisticAnalysis.processData = processData;

  it('statisticAnalysis01', function () {
    tabStatisticAnalysis.initElements();
    tabStatisticAnalysis.data = select;
    expect(tabStatisticAnalysis.currentSelection).toEqual(select);
  });

  it('statisticAnalysis02', function () {
    tabStatisticAnalysis.tabName.textContent = 'Statistic By Library Size';
    tabStatisticAnalysis.eventTypeData = [dataArray];
    let mouseMoveEvent: MouseEvent = new MouseEvent('click', <MouseEventInit>{ movementX: 1, movementY: 2 });
    tabStatisticAnalysis.back.dispatchEvent(mouseMoveEvent);
    tabStatisticAnalysis.back.dispatchEvent(mouseMoveEvent);
  });

  it('statisticAnalysis03', function () {
    tabStatisticAnalysis.getLibSize(dataArray, select);
    expect(tabStatisticAnalysis.currentLevel).toEqual(1);
  });

  it('statisticAnalysis04', function () {
    expect(tabStatisticAnalysis.getNMFunctionSize(dataArray, select)).toBeUndefined();
  });

  it('statisticAnalysis05', function () {
    tabStatisticAnalysis.calTypeSize(select, processData);
    expect(tabStatisticAnalysis.processData.length).toBe(1);
  });

  it('statisticAnalysis06', function () {
    let processData = [
      {
        applyId: 2345,
        callChainId: 31,
        count: 121,
        endTs: 4841020,
        id: 22945,
        libId: 420,
        libName: '[mmap] ld-musl-arm.so.1',
        pid: 1,
        size: 304,
        startTs: 6210233,
        symbolId: 321,
        symbolName: '[mmap] ld-musl-arm.so.1',
        tid: 213,
        type: 11,
      },
    ];
    tabStatisticAnalysis.calTypeSize(select, processData);
    expect(tabStatisticAnalysis.currentLevelReleaseCount).toBe(0);
  });

  it('statisticAnalysis07', function () {
    let processData = [
      {
        applyId: 632,
        callChainId: 120,
        count: 21,
        endTs: 46201110,
        id: 92045,
        libId: 20,
        libName: '[ThreadFuncC] nativetest_c',
        pid: 15,
        size: 304,
        startTs: 4533,
        symbolId: 429,
        symbolName: '[ThreadFuncC] nativetest_c',
        tid: 5211,
        type: 92,
      },
    ];
    tabStatisticAnalysis.calTypeSize(select, processData);
    expect(tabStatisticAnalysis.currentLevelApplySize).toBe(0);
  });

  it('statisticAnalysis08', function () {
    let processData = [
      {
        applyId: 2652,
        callChainId: 3,
        count: 1,
        endTs: 4865410,
        id: 2235,
        libId: 210,
        libName: '[DepthMalloc] nativetest_c',
        pid: 10,
        size: 3014,
        startTs: 4116233,
        symbolId: 40,
        symbolName: 'DepthMalloc',
        tid: 501,
        type: 30,
      },
    ];
    tabStatisticAnalysis.calTypeSize(select, processData);
    expect(tabStatisticAnalysis.processData.length).toBe(1);
  });

  it('statisticAnalysis09', function () {
    tabStatisticAnalysis.currentLevel = 0;
    tabStatisticAnalysis.sortByColumn('', 0);
    expect(tabStatisticAnalysis.tableType.recycleDataSource.length).toBe(1);
  });

  it('statisticAnalysis10', function () {
    tabStatisticAnalysis.currentLevel = 1;
    tabStatisticAnalysis.sortByColumn('', 0);
    expect(tabStatisticAnalysis.tableType.recycleDataSource.length).toBe(1);
  });

  it('statisticAnalysis11', function () {
    tabStatisticAnalysis.currentLevel = 2;
    tabStatisticAnalysis.sortByColumn('', 0);
    expect(tabStatisticAnalysis.tableType.recycleDataSource.length).toBe(1);
  });

  it('statisticAnalysis12', function () {
    tabStatisticAnalysis.currentLevel = 0;
    tabStatisticAnalysis.currentLevelData = [
      {
        tableName: 0,
      },
      {
        tableName: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('tableName', 1);
    tabStatisticAnalysis.currentLevelData = [
      {
        existSize: 0,
      },
      {
        existSize: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('existSizeFormat', 1);
    tabStatisticAnalysis.currentLevelData = [
      {
        existSize: 0,
      },
      {
        existSize: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('existSizePercent', 1);
    tabStatisticAnalysis.currentLevelData = [
      {
        existCount: 0,
      },
      {
        existCount: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('existCount', 1);
    tabStatisticAnalysis.currentLevelData = [
      {
        existCount: 0,
      },
      {
        existCount: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('existCountPercent', 1);
    expect(tabStatisticAnalysis.tableType.recycleDataSource.length).toBe(3);
  });

  it('statisticAnalysis13', function () {
    tabStatisticAnalysis.currentLevel = 1;
    tabStatisticAnalysis.currentLevelData = [
      {
        releaseSize: 0,
      },
      {
        releaseSize: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('releaseSizeFormat', 1);
    tabStatisticAnalysis.currentLevelData = [
      {
        releaseSize: 0,
      },
      {
        releaseSize: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('releaseSizePercent', 1);
    tabStatisticAnalysis.currentLevelData = [
      {
        releaseCount: 0,
      },
      {
        releaseCount: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('releaseCount', 1);
    tabStatisticAnalysis.currentLevelData = [
      {
        releaseCount: 0,
      },
      {
        releaseCount: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('releaseCountPercent', 1);
    expect(tabStatisticAnalysis.tableType.recycleDataSource.length).toBe(3);
  });

  it('statisticAnalysis14', function () {
    tabStatisticAnalysis.currentLevel = 2;
    tabStatisticAnalysis.currentLevelData = [
      {
        applySize: 0,
      },
      {
        applySize: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('applySizeFormat', 1);
    tabStatisticAnalysis.currentLevelData = [
      {
        applySize: 0,
      },
      {
        applySize: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('applySizePercent', 1);
    tabStatisticAnalysis.currentLevelData = [
      {
        applyCount: 0,
      },
      {
        applyCount: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('applyCount', 1);
    tabStatisticAnalysis.currentLevelData = [
      {
        applyCount: 0,
      },
      {
        applyCount: 1,
      },
    ];
    tabStatisticAnalysis.sortByColumn('applyCountPercent', 1);
    expect(tabStatisticAnalysis.tableType.recycleDataSource.length).toBe(3);
  });

  it('statisticAnalysis15', function () {
    tabStatisticAnalysis.isStatistic = true;
    let val = {
      leftNs: 0,
      rightNs: 1000,
      nativeMemoryStatistic: ['All Heap & Anonymous VM', 'All Heap', 'Heap'],
    };
    expect(tabStatisticAnalysis.getNMEventTypeSize(val)).toBeUndefined();
  });

  it('statisticAnalysis16', function () {
    tabStatisticAnalysis.isStatistic = false;
    let val = {
      leftNs: 0,
      rightNs: 1000,
      nativeMemory: ['All Heap & Anonymous VM', 'All Heap', 'Heap'],
    };
    expect(tabStatisticAnalysis.getNMEventTypeSize(val)).toBeUndefined();
  });

  it('statisticAnalysis17', function () {
    tabStatisticAnalysis.tabName.textContent;
    let mouseMoveEvent: MouseEvent = new MouseEvent('click', <MouseEventInit>{ movementX: 1, movementY: 2 });
    tabStatisticAnalysis.back.dispatchEvent(mouseMoveEvent);

    tabStatisticAnalysis.isStatistic = false;
    let val = {
      leftNs: 0,
      rightNs: 1000,
      nativeMemory: ['All Heap & Anonymous VM', 'All Heap', 'Heap'],
    };
    expect(tabStatisticAnalysis.getNMEventTypeSize(val)).toBeUndefined();
  });
  it('statisticAnalysis18', function () {
    let it = [
      {
        tabName: '',
      },
    ];
    tabStatisticAnalysis.totalData = jest.fn(() => true);
    tabStatisticAnalysis.pie = jest.fn(() => true);
    tabStatisticAnalysis.pie.hideTip = jest.fn(() => true);
    expect(tabStatisticAnalysis.nativeProcessLevelClickEvent(it)).toBeUndefined();
  });
  it('statisticAnalysis19', function () {
    let it = [
      {
        tabName: '',
      },
    ];
    tabStatisticAnalysis.totalData = jest.fn(() => true);
    tabStatisticAnalysis.pie = jest.fn(() => true);
    tabStatisticAnalysis.pie.hideTip = jest.fn(() => true);
    expect(tabStatisticAnalysis.nativeSoLevelClickEvent(it)).toBeUndefined();
  });
  it('statisticAnalysis20', function () {
    expect(tabStatisticAnalysis.calPercent([])).toBeUndefined();
  });
  it('statisticAnalysis21', function () {
    expect(tabStatisticAnalysis.calSizeObj([])).toBeTruthy();
  });
  it('statisticAnalysis23', function () {
    tabStatisticAnalysis.threadUsageTbl = jest.fn(() => true);
    tabStatisticAnalysis.threadUsageTbl.reMeauseHeight = jest.fn(() => true);
    tabStatisticAnalysis.threadUsageTbl.addEventListener = jest.fn(() => true);
    expect(tabStatisticAnalysis.getNMThreadSize(dataArray, select)).toBeUndefined();
  });
  it('statisticAnalysis24', function () {
    let itemClick = new CustomEvent('click', <CustomEventInit>{
      detail: {
        ...{},
        data: {},
      },
      composed: true,
    });
    tabStatisticAnalysis.tabName!.textContent = 'Statistic By Library Existing';
    tabStatisticAnalysis.typeStatisticsData = jest.fn(() => true);
    tabStatisticAnalysis.typeStatisticsData.allDuration = jest.fn(() => true);
    tabStatisticAnalysis.eventTypeData = [{}, {}];
    tabStatisticAnalysis.back!.dispatchEvent(itemClick);
    expect(tabStatisticAnalysis.getBack()).toBeUndefined();
  });
  it('statisticAnalysis25', function () {
    let itemClick = new CustomEvent('click', <CustomEventInit>{
      detail: {
        ...{},
        data: {},
      },
      composed: true,
    });
    tabStatisticAnalysis.tabName!.textContent = 'Statistic By Function Existing';
    tabStatisticAnalysis.libStatisticsData = jest.fn(() => true);
    tabStatisticAnalysis.libStatisticsData.allDuration = jest.fn(() => true);
    tabStatisticAnalysis.soData = [{}, {}];
    tabStatisticAnalysis.back!.dispatchEvent(itemClick);
    expect(tabStatisticAnalysis.getBack()).toBeUndefined();
  });
});
