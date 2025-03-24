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

import { BaseElement, element } from '../../../../../base-ui/BaseElement.js';
import { type LitTable } from '../../../../../base-ui/table/lit-table.js';
import { type SelectionParam } from '../../../../bean/BoxSelection.js';
import { GpuMemory } from '../../../../bean/AbilityMonitor.js';
import { resizeObserver } from '../SheetUtils.js';
import { getTabGpuMemoryAbilityData } from '../../../../database/SqlLite.js';
import { ns2s } from '../../../../database/ui-worker/ProcedureWorkerCommon.js';
import { MemoryConfig } from '../../../../bean/MemoryConfig.js';
import { Utils } from '../../base/Utils.js';
import { SpSystemTrace } from '../../../SpSystemTrace.js';

@element('tabpane-gpu-memory-ability')
export class TabPaneGpuMemoryAbility extends BaseElement {
  private gpuMemoryTableTbl: LitTable | null | undefined;
  private gpuMemorySource: Array<GpuMemory> = [];
  private tableThead: HTMLDivElement | undefined | null;
  private gpuMemoryTimeRange: HTMLLabelElement | undefined | null;
  private total: GpuMemory = new GpuMemory();

  set data(gpuMemoryAbilityValue: SelectionParam | any) {
    if (gpuMemoryAbilityValue.gpuMemoryAbilityData.length > 0) {
      this.gpuMemoryTimeRange!.textContent =
        'Selected range: ' +
        ((gpuMemoryAbilityValue.rightNs - gpuMemoryAbilityValue.leftNs) / 1000000.0).toFixed(5) +
        ' ms';
      this.gpuMemoryTableTbl!.loading = true;
      this.queryDataByDB(gpuMemoryAbilityValue);
      this.init();
    }
  }

  initElements(): void {
    this.gpuMemoryTableTbl = this.shadowRoot?.querySelector<LitTable>('#gpuMemoryTable');
    this.tableThead = this.gpuMemoryTableTbl?.shadowRoot?.querySelector('.thead') as HTMLDivElement;
    this.gpuMemoryTimeRange = this.shadowRoot?.querySelector<HTMLLabelElement>('#gpu-memory-time-range');
    this.gpuMemoryTableTbl!.addEventListener('column-click', (e) => {
      // @ts-ignore
      this.sortGpuMemoryByColumn(e.detail.key, e.detail.sort);
    });
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.gpuMemoryTableTbl!);
  }

  private init(): void {
    const thTable = this.tableThead!.querySelector('.th');
    const gpuMemoryTblNodes = thTable!.querySelectorAll('div');
    if (this.tableThead!.hasAttribute('sort')) {
      this.tableThead!.removeAttribute('sort');
      gpuMemoryTblNodes.forEach((item) => {
        item.querySelectorAll('svg').forEach((svg) => {
          svg.style.display = 'none';
        });
      });
    }
  }

  queryDataByDB(val: SelectionParam | any): void {
    getTabGpuMemoryAbilityData(val.leftNs, val.rightNs, (MemoryConfig.getInstance().interval * 1000000) / 5).then(
      (data) => {
        this.gpuMemoryTableTbl!.loading = false;
        if (data.length !== null && data.length > 0) {
          this.total = new GpuMemory();
          this.total.process = '*All*';
          this.total.gpuName = '*All*';
          data.forEach((gpuMemoryItem) => {
            if (gpuMemoryItem.processName !== null) {
              gpuMemoryItem.process = `${gpuMemoryItem.processName}(${gpuMemoryItem.processId})`;
            } else {
              gpuMemoryItem.process = `Process(${gpuMemoryItem.processId})`;
            }

            this.total.avgSize += gpuMemoryItem.avgSize;
            if (this.total.minSize < 0) {
              this.total.minSize = gpuMemoryItem.minSize;
            }
            if (this.total.maxSize < 0) {
              this.total.maxSize = gpuMemoryItem.maxSize;
            }
            this.total.minSize = Math.min(this.total.minSize, gpuMemoryItem.minSize);
            this.total.maxSize = Math.max(this.total.maxSize, gpuMemoryItem.maxSize);
            gpuMemoryItem.gpuName = SpSystemTrace.DATA_DICT.get(gpuMemoryItem.gpuNameId) || '';
            gpuMemoryItem.avgSizes = Utils.getBinaryByteWithUnit(Math.round(gpuMemoryItem.avgSize));
            gpuMemoryItem.minSizes = Utils.getBinaryByteWithUnit(gpuMemoryItem.minSize);
            gpuMemoryItem.maxSizes = Utils.getBinaryByteWithUnit(gpuMemoryItem.maxSize);
          });
          this.total.avgSizes = Utils.getBinaryByteWithUnit(Math.round(this.total.avgSize / data.length));
          this.total.minSizes = Utils.getBinaryByteWithUnit(this.total.minSize);
          this.total.maxSizes = Utils.getBinaryByteWithUnit(this.total.maxSize);
          this.gpuMemorySource = data;
          this.gpuMemorySource.sort(function (gpuMemoryLeftData: GpuMemory, gpuMemoryRightData: GpuMemory) {
            return gpuMemoryRightData.avgSize - gpuMemoryLeftData.avgSize;
          });
          this.gpuMemoryTableTbl!.recycleDataSource = [this.total, ...this.gpuMemorySource];
        } else {
          this.gpuMemoryTableTbl!.recycleDataSource = [];
          this.gpuMemorySource = [];
        }
      }
    );
  }

  initHtml(): string {
    return `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        .gpu-memory-label{
            display: flex;
            height: 20px;
            align-items: center;
            flex-direction: row;
            margin-bottom: 5px
        }
        #gpu-memory-time-range{
            width: auto;
            text-align: end;
            font-size: 10pt;
        }
        </style>
        <div class="gpu-memory-label">
            <div style="flex: 1"></div>
            <label id="gpu-memory-time-range">Selected range:0.0 ms</label>
        </div>
        <div style="overflow: auto">
        <lit-table id="gpuMemoryTable" class="gpuMemoryTable">
            <lit-table-column order title="GpuName" data-index="gpuName" key="gpuName" align="flex-start" width="1fr" >
            </lit-table-column>
            <lit-table-column order title="Process" data-index="process" key="process" align="flex-start" width="1fr" >
            </lit-table-column>
            <lit-table-column order title="AvgSize" data-index="avgSizes" key="avgSize" align="flex-start" width="1fr" >
            </lit-table-column>
            <lit-table-column order title="MaxSize" data-index="maxSizes" key="maxSize" align="flex-start" width="1fr" >
            </lit-table-column>
            <lit-table-column order title="MinSize" data-index="minSizes" key="minSize" align="flex-start" width="1fr" >
            </lit-table-column>
        </lit-table>
        </div>
        `;
  }

  sortGpuMemoryByColumn(column: string, sort: number): void {
    switch (sort) {
      case 0:
        this.gpuMemoryTableTbl!.recycleDataSource = [this.total, this.gpuMemorySource];
        break;
      default:
        let array = [...this.gpuMemorySource];
        switch (column) {
          case 'process':
            array.sort((gpuMemoryLeftData, gpuMemoryRightData) => {
              return sort === 1
                ? `${gpuMemoryLeftData.process}`.localeCompare(`${gpuMemoryRightData.process}`)
                : `${gpuMemoryRightData.process}`.localeCompare(`${gpuMemoryLeftData.process}`);
            });
            break;
          case 'gpuName':
            array.sort((gpuMemoryLeftData, gpuMemoryRightData) => {
              return sort === 1
                ? `${gpuMemoryLeftData.gpuName}`.localeCompare(`${gpuMemoryRightData.gpuName}`)
                : `${gpuMemoryRightData.gpuName}`.localeCompare(`${gpuMemoryLeftData.gpuName}`);
            });
            break;
          case 'avgSize':
            array.sort((gpuMemoryLeftData, gpuMemoryRightData) => {
              return sort === 1
                ? gpuMemoryLeftData.avgSize - gpuMemoryRightData.avgSize
                : gpuMemoryRightData.avgSize - gpuMemoryLeftData.avgSize;
            });
            break;
          case 'minSize':
            array.sort((gpuMemoryLeftData, gpuMemoryRightData) => {
              return sort === 1
                ? gpuMemoryLeftData.minSize - gpuMemoryRightData.minSize
                : gpuMemoryRightData.minSize - gpuMemoryLeftData.minSize;
            });
            break;
          case 'maxSize':
            array.sort((gpuMemoryLeftData, gpuMemoryRightData) => {
              return sort === 1
                ? gpuMemoryLeftData.maxSize - gpuMemoryRightData.maxSize
                : gpuMemoryRightData.maxSize - gpuMemoryLeftData.maxSize;
            });
            break;
        }
        this.gpuMemoryTableTbl!.recycleDataSource = [this.total, ...array];
        break;
    }
  }
}
