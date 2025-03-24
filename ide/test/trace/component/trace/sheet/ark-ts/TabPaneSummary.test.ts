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
//@ts-ignore
import { TabPaneSummary } from '../../../../../../dist/trace/component/trace/sheet/ark-ts/TabPaneSummary.js';
//@ts-ignore
import { HeapDataInterface } from '../../../../../../dist/js-heap/HeapDataInterface.js';
//@ts-ignore
import { SpArkTsChart } from '../../../../../../dist/trace/component/chart/SpArkTsChart.js';

jest.mock('../../../../../../dist/js-heap/model/DatabaseStruct.js', () => {});

jest.mock('../../../../../../dist/base-ui/select/LitSelect.js', () => {
    return {};
});

jest.mock('../../../../../../dist/trace/database/ui-worker/ProcedureWorker.js', () => {
    return {};
});

// @ts-ignore
window.ResizeObserver =
    window.ResizeObserver ||
    jest.fn().mockImplementation(() => ({
        disconnect: jest.fn(),
        observe: jest.fn(),
        unobserve: jest.fn(),
    }));

describe('TabPaneSummary Test', () => {
    let tabPaneSummary = new TabPaneSummary();
    tabPaneSummary.tbs = jest.fn(() => {
        return {
            scrollTop: 0,
        };
    });
    tabPaneSummary.tbs.snapshotDataSource = jest.fn(() => {
        return [];
    });
    it('TabPaneSummaryTest01', () => {
        document.body.innerHTML = `<tabpane-summary id="sss"> </tabpane-summary>`;
        let tabPaneSummary = document.querySelector('#sss') as TabPaneSummary;
        tabPaneSummary.tbsTable = jest.fn(() => {
            return {
                scrollTop: 0,
            };
        });
        let childenData = [
            {
                addedCount: 49,
                addedIndx: [33, 3],
                addedSize: 336,
                childCount: 1296,
                children: [],
                classChildren: [],
                deletedIdx: [325, 338],
                deltaCount: 0,
                deltaSize: 12,
                distance: 61,
                edgeCount: 0,
                edgeName: 'TSFunctionType',
                fileId: 0,
                hasNext: true,
                id: 44,
                index: 30,
                isAdd: false,
                isHover: false,
                isSelected: false,
                nextId: [],
                nodeName: 'TSFunctionType',
                objectName: 'TSFunctionTypeX98',
                removedCount: 38,
                removedSize: 3332,
                retainedSize: -1,
                retains: [],
                shallowSize: 414,
                showBox: false,
                showCut: false,
                status: true,
                targetFileId: 1,
                traceNodeId: 34,
                type: 314,
            },
            {
                addedCount: 649,
                addedIndx: [219, 7],
                addedSize: 78,
                childCount: 46,
                children: [],
                classChildren: [],
                deletedIdx: [6, 787],
                deltaCount: 0,
                deltaSize: 87,
                distance: -1,
                edgeCount: 77,
                edgeName: 'CompletionRecord',
                fileId: 23,
                hasNext: true,
                id: 4,
                index: 70,
                isAdd: false,
                isHover: false,
                isSelected: false,
                nextId: [],
                nodeName: 'CompletionRecord',
                objectName: 'CompletionRecordX22',
                removedCount: 648,
                removedSize: 72,
                retainedSize: -1,
                retains: [],
                shallowSize: 77,
                showBox: false,
                showCut: false,
                status: true,
                targetFileId:771,
                traceNodeId: 87,
                type: 994,
            },
        ];
        let retainsData = [
            {
                shallowSize: 10,
                retainedSize: 10,
                shallowPercent: 10,
                retainedPercent: 10,
                distance: 1000000001,
                nodeName: '(system)',
                objectName: '(system)X23',
                edgeName: '(system)',
                children: childenData,
            },
            {
                shallowSize: 1,
                retainedSize: 1,
                shallowPercent: 1,
                retainedPercent: 1,
                distance: 100000000,
                nodeName: 'HiddenClass',
                objectName: 'HiddenClassX34',
                edgeName: 'HiddenClass',
                children: childenData,
            },
        ];
        let ddd = [
            {
                addedCount: 6128,
                addedIndx: [119, 326],
                addedSize: 652,
                childCount: 1296,
                children: [],
                classChildren: [],
                deletedIdx: [225, 338],
                deltaCount: 0,
                deltaSize: -16,
                distance: -1,
                edgeCount: 0,
                edgeName: 'JSOBJECT(Ctor=12',
                fileId: 0,
                hasNext: true,
                id: -1,
                index: 0,
                isAdd: false,
                isHover: false,
                isSelected: false,
                nextId: [],
                nodeName: 'JSOBJECT(Ctor=',
                objectName: 'JSOBJECT(Ctor= X34',
                removedCount: 648,
                removedSize: 38952,
                retainedSize: -1,
                retains: [],
                shallowSize: -1,
                showBox: false,
                showCut: false,
                status: true,
                targetFileId: 21,
                traceNodeId: -1,
                type: 224,
            },
            {
                addedCount: 648,
                addedIndx: [319, 23],
                addedSize: 37,
                childCount: 122,
                children: [],
                classChildren: [],
                deletedIdx: [35, 328],
                deltaCount: 70,
                deltaSize: 36,
                distance: 9,
                edgeCount: 0,
                edgeName: 'Proxy',
                fileId: 1,
                hasNext: true,
                id: -1,
                index: 990,
                isAdd: false,
                isHover: false,
                isSelected: false,
                nextId: [],
                nodeName: 'Proxy',
                objectName: 'ProxyX21',
                removedCount: 648,
                removedSize: 382,
                retainedSize: -1,
                retains: [],
                shallowSize: 981,
                showBox: false,
                showCut: false,
                status: true,
                targetFileId: 81,
                traceNodeId: 121,
                type: 34,
            },
            {
                addedCount: 61,
                addedIndx: [31, 31],
                addedSize: 86,
                childCount: 1686,
                children: [],
                classChildren: [],
                deletedIdx: [123, 108],
                deltaCount: 0,
                deltaSize: 996,
                distance: 91,
                edgeCount: 0,
                edgeName: 'InternalAccessort44',
                fileId: 2,
                hasNext: true,
                id: -1,
                index: 90,
                isAdd: false,
                isHover: false,
                isSelected: false,
                nextId: [],
                nodeName: 'InternalAccessor',
                objectName: 'InternalAccessorX32',
                removedCount: 648,
                removedSize: 31199,
                retainedSize: 98,
                retains: [],
                shallowSize: 91,
                showBox: false,
                showCut: false,
                status: true,
                targetFileId: 81,
                traceNodeId: 1,
                type: 2,
            },
        ];
        let htmlDivElement = document.createElement('div');
        tabPaneSummary.leftTheadTable = jest.fn(() => htmlDivElement);
        tabPaneSummary.rightTheadTable = jest.fn(() => htmlDivElement);
        tabPaneSummary.tbsTable = jest.fn(() => {
            return {
                scrollTop: 0,
            };
        });

        tabPaneSummary.rightTheadTable.removeAttribute = jest.fn(() => true);
        tabPaneSummary.rightTheadTable.hasAttribute = jest.fn(() => {});

        tabPaneSummary.leftTheadTable.hasAttribute = jest.fn(() => {});
        tabPaneSummary.leftTheadTable.removeAttribute = jest.fn(() => true);

        tabPaneSummary.file = {
            name: 'Timeline',
            id: '',
        };
        HeapDataInterface.getInstance().getAllocationStackData = jest.fn(() => {
            return [
                {
                    id: 10,
                    index: 20,
                    name: '',
                    scriptName: '',
                    scriptId: 50,
                    line: 30,
                    column: 670,
                },
                {
                    id: 60,
                    index: 50,
                    name: '',
                    scriptName: 'string',
                    scriptId: 40,
                    line: 980,
                    column: 90,
                },
            ];
        });

        let htmlDivElement1 = document.createElement('div');
        htmlDivElement1.className = 'table';
        tabPaneSummary.tbs.meauseTreeRowElement = jest.fn(() => {
            return [];
        });
        tabPaneSummary.tblSummary.meauseTreeRowElement = jest.fn(() => {
            return [];
        });
        let rowObjectData = {
            top: 1,
            height: 0,
            rowIndex: 1,
            data: {
                status: true,
                targetFileId: 123,
                children: childenData,
                getChildren: () => {},
            },
            expanded: true,
            rowHidden: false,
            children: childenData,
            depth: -1,
        };
        HeapDataInterface.getInstance().getRetains = jest.fn(() => retainsData);
        let iconRowClick = new CustomEvent('row-click', <CustomEventInit>{
            detail: {
                data: rowObjectData.data,
            },
            composed: true,
        });

        let iconClick = new CustomEvent('icon-click', <CustomEventInit>{
            detail: {
                data: rowObjectData.data,
            },
            composed: true,
        });
        let iconkeyUpClick = new CustomEvent('keyup', <CustomEventInit>{
            detail: {
                key: 'addedCount',
                sort: 1,
            },
            composed: true,
        });
        iconClick.detail.data.isString = jest.fn(() => true);
        tabPaneSummary.tblSummary.dispatchEvent(iconRowClick);
        tabPaneSummary.tblSummary.dispatchEvent(iconClick);
        tabPaneSummary.tbs.dispatchEvent(iconClick);
        tabPaneSummary.sortByLeftTable('distance', 0);
        tabPaneSummary.sortByLeftTable('shallowSize', 1);
        tabPaneSummary.sortByLeftTable('retainedSize', 1);
        tabPaneSummary.sortByLeftTable('objectName', 1);
        HeapDataInterface.getInstance().getClassesListForSummary = jest.fn(() => {
            return retainsData;
        });

        expect(tabPaneSummary.initSummaryData({  name: 'Timeline', id: ''}, 0, 0)).toBeUndefined();
    });
    it('TabPaneSummaryTest02', () => {
        document.body.innerHTML = `<tabpane-summary id="ts"> </tabpane-summary>`;
        let tabPaneSummary = document.querySelector('#ts') as TabPaneSummary;
        expect(tabPaneSummary.sortByLeftTable('shallowSize', 1)).toBeUndefined();
    });
    it('TabPaneSummaryTest03', () => {
        document.body.innerHTML = `<tabpane-summary id="ts"> </tabpane-summary>`;
        let tabPaneSummary = document.querySelector('#ts') as TabPaneSummary;
        expect(tabPaneSummary.sortByLeftTable('retainedSize', 1)).toBeUndefined();
    });
    it('TabPaneSummaryTest04', () => {
        document.body.innerHTML = `<tabpane-summary id="ts"> </tabpane-summary>`;
        let tabPaneSummary = document.querySelector('#ts') as TabPaneSummary;
        expect(tabPaneSummary.sortByLeftTable('distance', 1)).toBeUndefined();
    });

    it('TabPaneSummaryTest05', () => {
        document.body.innerHTML = `<tabpane-summary id="ts"> </tabpane-summary>`;
        let tabPaneSummary = document.querySelector('#ts') as TabPaneSummary;
        expect(tabPaneSummary.sortByRightTable('shallowSize', 1)).toBeUndefined();
    });
    it('TabPaneSummaryTest06', () => {
        document.body.innerHTML = `<tabpane-summary id="ts"> </tabpane-summary>`;
        let tabPaneSummary = document.querySelector('#ts') as TabPaneSummary;
        expect(tabPaneSummary.sortByRightTable('retainedSize', 1)).toBeUndefined();
    });
    it('TabPaneSummaryTest07', () => {
        document.body.innerHTML = `<tabpane-summary id="ts"> </tabpane-summary>`;
        let tabPaneSummary = document.querySelector('#ts') as TabPaneSummary;
        expect(tabPaneSummary.sortByRightTable('distance', 1)).toBeUndefined();
    });

    it('TabPaneSummaryTest08', () => {
        document.body.innerHTML = `<tabpane-summary id="ts"> </tabpane-summary>`;
        let tabPaneSummary = document.querySelector('#ts') as TabPaneSummary;
        expect(tabPaneSummary.sortByRightTable('objectName', 1)).toBeUndefined();
    });

    it('TabPaneSummaryTest09', () => {
        expect(tabPaneSummary.clickToggleTable()).toBeUndefined();
    });
    it('TabPaneSummaryTest10', () => {
        expect(tabPaneSummary.classFilter()).toBeUndefined();
    });
});
