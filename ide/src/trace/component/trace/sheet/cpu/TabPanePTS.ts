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
import { LitTable, RedrawTreeForm } from '../../../../../base-ui/table/lit-table.js';
import { SelectionParam } from '../../../../bean/BoxSelection.js';
import { resizeObserver } from '../SheetUtils.js';
import { procedurePool } from '../../../../database/Procedure.js';
import { Utils } from '../../base/Utils.js';
import { SliceGroup } from '../../../../bean/StateProcessThread.js';

@element('tabpane-pts')
export class TabPanePTS extends BaseElement {
  private ptsTbl: LitTable | null | undefined;
  private ptsRange: HTMLLabelElement | null | undefined;
  private selectionParam: SelectionParam | null | undefined;

  set data(ptsValue: SelectionParam | any) {
    if (ptsValue == this.selectionParam) {
      return;
    }
    this.selectionParam = ptsValue;
    this.ptsRange!.textContent =
      'Selected range: ' + parseFloat(((ptsValue.rightNs - ptsValue.leftNs) / 1000000.0).toFixed(5)) + ' ms';
    this.getDataByPTS(ptsValue.leftNs, ptsValue.rightNs, ptsValue.cpus);
  }

  initElements(): void {
    this.ptsTbl = this.shadowRoot?.querySelector<LitTable>('#pts-tbl');
    this.ptsRange = this.shadowRoot?.querySelector('#pts-time-range');
    this.ptsTbl!.itemTextHandleMap.set('title', Utils.transferPTSTitle);
  }

  getDataByPTS(ptsLeftNs: number, ptsRightNs: number, cpus: Array<number>) {
    this.ptsTbl!.loading = true;
    procedurePool.submitWithName(
      'logic1',
      'spt-getPTS',
      { leftNs: ptsLeftNs, rightNs: ptsRightNs, cpus: cpus },
      undefined,
      (res: Array<SliceGroup>) => {
        this.ptsTbl!.loading = false;
        this.ptsTbl!.recycleDataSource = res;
        this.theadClick(res);
      }
    );
  }
  private theadClick(data: Array<SliceGroup>) {
    let labels = this.ptsTbl?.shadowRoot?.querySelector('.th > .td')!.querySelectorAll('label');
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        let label = labels[i].innerHTML;
        labels[i].addEventListener('click', (e) => {
          if (label.includes('Process') && i === 0) {
            this.ptsTbl!.setStatus(data, false);
            this.ptsTbl!.recycleDs = this.ptsTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('Thread') && i === 1) {
            for (let item of data) {
              item.status = true;
              if (item.children != undefined && item.children.length > 0) {
                this.ptsTbl!.setStatus(item.children, false);
              }
            }
            this.ptsTbl!.recycleDs = this.ptsTbl!.meauseTreeRowElement(data, RedrawTreeForm.Retract);
          } else if (label.includes('State') && i === 2) {
            this.ptsTbl!.setStatus(data, true);
            this.ptsTbl!.recycleDs = this.ptsTbl!.meauseTreeRowElement(data, RedrawTreeForm.Expand);
          }
        });
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    resizeObserver(this.parentElement!, this.ptsTbl!);
  }
  initHtml(): string {
    return `<style>
        :host{
            display: flex;
            padding: 10px 10px;
            flex-direction: column;
        }
        </style>
        <label id="pts-time-range" style="width: 100%;height: 20px;text-align: end;font-size: 10pt;margin-bottom: 5px">Selected range:0.0 ms</label>
        <lit-table id="pts-tbl" style="height: auto" tree>
            <lit-table-column class="pts-column" title="Process/Thread/State" data-index="title" key="title" align="flex-start" width="27%"retract>
            </lit-table-column>
            <lit-table-column class="pts-column" title="Count" data-index="count" key="count" align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column class="pts-column" title="Duration(ns)" data-index="wallDuration" key="wallDuration" align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column class="pts-column" title="Min Duration(ns)" data-index="minDuration" key="minDuration" align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column class="pts-column" title="Avg Duration(ns)" data-index="avgDuration" key="avgDuration" align="flex-start" width="1fr">
            </lit-table-column>
            <lit-table-column class="pts-column" title="Max Duration(ns)" data-index="maxDuration" key="maxDuration" align="flex-start" width="1fr">
            </lit-table-column>
        </lit-table>
        `;
  }
}
