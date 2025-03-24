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
import { MemoryConfig } from '../../../../bean/MemoryConfig.js';
import { type SelectionParam } from '../../../../bean/BoxSelection.js';
import { queryProcessPurgeableSelectionTab, querySysPurgeableSelectionTab } from '../../../../database/SqlLite.js';
import { ns2s } from '../../../../database/ui-worker/ProcedureWorkerCommon.js';
import { Utils } from '../../base/Utils.js';
import { resizeObserver } from '../SheetUtils.js';

@element('tabpane-purg-pin-selection')
export class TabPanePurgPinSelection extends BaseElement {
  private purgeableSelectionTable: LitTable | null | undefined;
  private purgeableSelectionSource: Array<any> = [];

  set data(selection: SelectionParam | any) {
    if (selection && selection.type) {
      this.queryTableData(selection.type, selection.startNs);
    }
  }

  async queryTableData(type: string, startNs: number): Promise<void> {
    if (type === 'ability') {
      await querySysPurgeableSelectionTab(startNs, true).then((purgePinSelectResults) => {
        this.purgeableSelectionSource = [];
        this.purgeableSelectionSource.push({ name: 'TimeStamp', value: ns2s(startNs) });
        this.purgeableSelectionSource.push({
          name: 'TimeStamp(Absolute)',
          value: (startNs + (window as any).recordStartNS) / 1000000000,
        });
        for (let i = 0; i < purgePinSelectResults.length; i++) {
          purgePinSelectResults[i].value = Utils.getBinaryByteWithUnit(purgePinSelectResults[i].value);
          this.purgeableSelectionSource.push(purgePinSelectResults[i]);
          this.purgeableSelectionTable!.recycleDataSource = this.purgeableSelectionSource;
        }
      });
    } else if (type === 'VM') {
      await queryProcessPurgeableSelectionTab(startNs, MemoryConfig.getInstance().iPid, true).then((results) => {
        this.purgeableSelectionSource = [];
        this.purgeableSelectionSource.push({ name: 'TimeStamp(Relative)', value: ns2s(startNs) });
        this.purgeableSelectionSource.push({
          name: 'TimeStamp(Absolute)',
          value: (startNs + (window as any).recordStartNS) / 1000000000,
        });
        for (let i = 0; i < results.length; i++) {
          results[i].value = Utils.getBinaryByteWithUnit(results[i].value);
          this.purgeableSelectionSource.push(results[i]);
          this.purgeableSelectionTable!.recycleDataSource = this.purgeableSelectionSource;
        }
      });
    }
  }

  initElements(): void {
    this.purgeableSelectionTable = this.shadowRoot?.querySelector<LitTable>('#selectionTbl');
  }

  connectedCallback(): void {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.purgeableSelectionTable!);
  }

  initHtml(): string {
    return `
        <style>
        :host{
            display: flex;
            flex-direction: column;
            padding: 10px 10px;
        }
        </style>
        <lit-table id="selectionTbl" no-head>
            <lit-table-column title="name" data-index="name" key="name" align="flex-start" width="180px">
                <template><div>{{name}}</div></template>
            </lit-table-column>
            <lit-table-column title="value" data-index="value" key="value" align="flex-start" >
                <template><div style="display: flex;">{{value}}</div></template>
            </lit-table-column>
        </lit-table>
        `;
  }
}
