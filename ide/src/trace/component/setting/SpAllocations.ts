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

import { BaseElement, element } from '../../../base-ui/BaseElement.js';
import { log } from '../../../log/Log.js';
import { HdcDeviceManager } from '../../../hdc/HdcDeviceManager.js';
import { LitAllocationSelect } from '../../../base-ui/select/LitAllocationSelect.js';
import '../../../base-ui/select/LitAllocationSelect.js';
import { SpApplication } from '../../SpApplication.js';
import { LitSearch } from '../trace/search/Search.js';
import { SpRecordTrace } from '../SpRecordTrace.js';
import { Cmd } from '../../../command/Cmd.js';
import { CmdConstant } from '../../../command/CmdConstant.js';
import LitSwitch from '../../../base-ui/switch/lit-switch.js';
import { LitSlider } from '../../../base-ui/slider/LitSlider';

@element('sp-allocations')
export class SpAllocations extends BaseElement {
  private processId: LitAllocationSelect | null | undefined;
  private unwindEL: HTMLInputElement | null | undefined;
  private shareMemory: HTMLInputElement | null | undefined;
  private shareMemoryUnit: HTMLSelectElement | null | undefined;
  private filterMemory: HTMLInputElement | null | undefined;
  private intervalResultInput: HTMLInputElement | null | undefined;
  private filterMemoryUnit: HTMLSelectElement | null | undefined;
  private fpUnWind: LitSwitch | null | undefined;
  private statisticsSlider: LitSlider | null | undefined;

  private recordAccurately: LitSwitch | null | undefined;
  private offlineSymbol: LitSwitch | null | undefined;
  private startupMode: LitSwitch | null | undefined;
  private recordStatisticsResult: HTMLDivElement | null | undefined;

  set startSamp(allocationStart: boolean) {
    if (allocationStart) {
      this.setAttribute('startSamp', '');
    } else {
      this.removeAttribute('startSamp');
    }
  }

  get startSamp(): boolean {
    return this.hasAttribute('startSamp');
  }

  get appProcess(): string {
    return this.processId!.value || '';
  }

  get unwind(): number {
    log('unwind value is :' + this.unwindEL!.value);
    return Number(this.unwindEL!.value);
  }

  get shared(): number {
    let value = this.shareMemory?.value || '';
    log('shareMemory value is :' + value);
    if (value != '') {
      let unit = Number(this.shareMemory?.value) || 16384;
      return unit;
    }
    return 16384;
  }

  get filter(): number {
    let value = this.filterMemory?.value || '';
    log('filter value is :' + value);
    if (value != '') {
      return Number(value);
    }
    return 0;
  }

  get fp_unwind(): boolean {
    let value = this.fpUnWind?.checked;
    if (value != undefined) {
      return value;
    }
    return true;
  }

  get record_accurately(): boolean {
    let value = this.recordAccurately?.checked;
    if (value != undefined) {
      return value;
    }
    return true;
  }

  get offline_symbolization(): boolean {
    let value = this.offlineSymbol?.checked;
    if (value != undefined) {
      return value;
    }
    return true;
  }

  get record_statistics(): boolean {
    if (this.recordStatisticsResult?.hasAttribute('percent')) {
      let value = Number(this.recordStatisticsResult?.getAttribute('percent'));
      return value > 0;
    }
    return true;
  }

  get statistics_interval(): number {
    if (this.recordStatisticsResult?.hasAttribute('percentValue')) {
      return Number(this.recordStatisticsResult?.getAttribute('percentValue'));
    }
    return 3600;
  }

  get startup_mode(): boolean {
    let value = this.startupMode?.checked;
    if (value != undefined) {
      return value;
    }
    return false;
  }

  initElements(): void {
    this.processId = this.shadowRoot?.getElementById('pid') as LitAllocationSelect;
    let process = this.processId.shadowRoot?.querySelector('.multipleSelect') as HTMLDivElement;
    let sp = document.querySelector('sp-application') as SpApplication;
    let litSearch = sp?.shadowRoot?.querySelector('#lit-record-search') as LitSearch;
    let allocationProcessData: Array<string> = [];
    process.addEventListener('mousedown', (ev) => {
      if (SpRecordTrace.serialNumber === '') {
        this.processId!.processData = [];
      }
    });
    process.addEventListener('valuable', (ev) => {
      this.dispatchEvent(new CustomEvent('addProbe', {}));
    });
    process.addEventListener('inputClick', () => {
      allocationProcessData = [];
      if (this.startup_mode) {
        this.processId!.processData = [];
        return;
      }
      if (SpRecordTrace.serialNumber != '') {
        Cmd.getProcess().then((processList) => {
          this.processId!.processData = processList;
          this.processId!.initData();
        });
      }
    });
    this.unwindEL = this.shadowRoot?.getElementById('unwind') as HTMLInputElement;
    this.shareMemory = this.shadowRoot?.getElementById('shareMemory') as HTMLInputElement;
    this.shareMemoryUnit = this.shadowRoot?.getElementById('shareMemoryUnit') as HTMLSelectElement;
    this.filterMemory = this.shadowRoot?.getElementById('filterSized') as HTMLInputElement;
    this.filterMemoryUnit = this.shadowRoot?.getElementById('filterSizedUnit') as HTMLSelectElement;
    this.fpUnWind = this.shadowRoot?.getElementById('use_fp_unwind') as LitSwitch;
    this.recordAccurately = this.shadowRoot?.getElementById('use_record_accurately') as LitSwitch;
    this.offlineSymbol = this.shadowRoot?.getElementById('use_offline_symbolization') as LitSwitch;
    this.startupMode = this.shadowRoot?.getElementById('use_startup_mode') as LitSwitch;
    let stepValue = [0, 1, 10, 30, 60, 300, 600, 1800, 3600];
    this.statisticsSlider = this.shadowRoot?.querySelector<LitSlider>('#interval-slider') as LitSlider;

    this.recordStatisticsResult = this.shadowRoot?.querySelector<HTMLDivElement>(
      '.record-statistics-result'
    ) as HTMLDivElement;
    this.statisticsSlider.sliderStyle = {
      minRange: 0,
      maxRange: 3600,
      defaultValue: '900',
      resultUnit: 'S',
      stepSize: 450,
      lineColor: 'var(--dark-color3,#46B1E3)',
      buttonColor: '#999999',
    };
    let parentElement = this.statisticsSlider!.parentNode as Element;
    this.intervalResultInput = this.shadowRoot?.querySelector('.interval-result') as HTMLInputElement;
    this.intervalResultInput.value = '10';
    this.statisticsSlider.addEventListener('input', (evt) => {
      this.statisticsSlider!.sliderStyle = {
        minRange: 0,
        maxRange: 3600,
        defaultValue: this.recordStatisticsResult!.getAttribute('percent') + '',
        resultUnit: 'S',
        stepSize: 450,
        lineColor: 'var(--dark-color3,#46B1E3)',
        buttonColor: '#999999',
      };
      this.intervalResultInput!.style.color = 'var(--dark-color1,#000000)';
      if (this.recordStatisticsResult!.hasAttribute('percent')) {
        let step = Math.round(Number(this.recordStatisticsResult!.getAttribute('percent')) / 450);
        this.recordStatisticsResult!.setAttribute('percentValue', stepValue[step] + '');
        this.intervalResultInput!.value = stepValue[step] + '';
      }
    });
    parentElement.setAttribute('percent', '3600');
    this.intervalResultInput.style.color = 'var(--dark-color1,#000000)';
    this.intervalResultInput.addEventListener('input', (ev) => {
      if (this.recordStatisticsResult!.hasAttribute('percent')) {
        this.recordStatisticsResult!.removeAttribute('percent');
      }
      this.intervalResultInput!.style.color = 'var(--dark-color1,#000000)';
      this.intervalResultInput!.parentElement!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
      this.intervalResultInput!.style.backgroundColor = 'var(--dark-background5,#F2F2F2)';
      if (this.intervalResultInput!.value.trim() === '') {
        this.intervalResultInput!.style.color = 'red';
        parentElement.setAttribute('percent', '3600');
        return;
      }
      let memorySize = Number(this.intervalResultInput!.value);
      if (
        memorySize < this.statisticsSlider!.sliderStyle.minRange ||
        memorySize > this.statisticsSlider!.sliderStyle.maxRange
      ) {
        this.intervalResultInput!.style.color = 'red';
        parentElement.setAttribute('percent', '3600');
      } else {
        this.statisticsSlider!.percent = this.intervalResultInput!.value;
        let htmlInputElement = this.statisticsSlider!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
        htmlInputElement.value = this.intervalResultInput!.value;
        this.statisticsSlider!.sliderStyle = {
          minRange: 0,
          maxRange: 3600,
          defaultValue: this.intervalResultInput!.value,
          resultUnit: 'S',
          stepSize: 1,
          lineColor: 'var(--dark-color3,#46B1E3)',
          buttonColor: '#999999',
        };
        parentElement.setAttribute('percent', this.intervalResultInput!.value);
        parentElement.setAttribute('percentValue', this.intervalResultInput!.value);
      }
    });

    this.intervalResultInput.addEventListener('focusout', (ev) => {
      if (this.intervalResultInput!.value.trim() === '') {
        parentElement.setAttribute('percent', '3600');
        this.intervalResultInput!.value = '3600';
        this.intervalResultInput!.style.color = 'var(--dark-color,#6a6f77)';
        parentElement.setAttribute('percent', this.intervalResultInput!.value);
        parentElement.setAttribute('percentValue', this.intervalResultInput!.value);
        this.statisticsSlider!.percent = this.intervalResultInput!.value;
        let htmlInputElement = this.statisticsSlider!.shadowRoot?.querySelector('#slider') as HTMLInputElement;
        htmlInputElement.value = this.intervalResultInput!.value;
      }
    });
    this.statisticsSlider.shadowRoot?.querySelector<HTMLElement>('#slider')!.addEventListener('mouseup', (ev) => {
      setTimeout(() => {
        let percentValue = this.recordStatisticsResult!.getAttribute('percent');
        let index = Math.round(Number(percentValue) / 450);
        index = index < 1 ? 0 : index;
        this.intervalResultInput!.value = stepValue[index] + '';
        this.recordStatisticsResult!.setAttribute('percentValue', stepValue[index] + '');
      });
    });
    this.startupMode.addEventListener('change', (evt) => {
      if (this.startup_mode) {
        this.processId!.value = '';
        this.processId!.placeholder = 'please input process';
      } else {
        this.processId!.value = '';
        this.processId!.placeholder = 'please select process';
      }
    });

    let litSwitch = this.shadowRoot?.querySelector('lit-switch') as LitSwitch;
    litSwitch.addEventListener('change', (event: any) => {
      let detail = event.detail;
      if (detail.checked) {
        this.unDisable();
      } else {
        this.disable();
      }
    });
    this.disable();
  }

  private unDisable() {
    this.startSamp = true;
    if (this.fpUnWind) {
      this.fpUnWind.disabled = false;
    }
    if (this.recordAccurately) {
      this.recordAccurately.disabled = false;
    }
    if (this.offlineSymbol) {
      this.offlineSymbol.disabled = false;
    }
    if (this.startupMode) {
      this.startupMode.disabled = false;
    }
    this.processId!.removeAttribute('disabled');
    let inputBoxes = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.inputBoxes');
    inputBoxes!.forEach((item) => {
      item.disabled = false;
    });
    this.statisticsSlider!.disabled = false;
  }

  private disable() {
    this.startSamp = false;
    if (this.fpUnWind) {
      this.fpUnWind.disabled = true;
    }
    if (this.recordAccurately) {
      this.recordAccurately.disabled = true;
    }
    if (this.startupMode) {
      this.startupMode.disabled = true;
    }
    if (this.offlineSymbol) {
      this.offlineSymbol.disabled = true;
    }
    this.processId!.setAttribute('disabled', '');
    let inputBoxes = this.shadowRoot?.querySelectorAll<HTMLInputElement>('.inputBoxes');
    inputBoxes!.forEach((item) => {
      item.disabled = true;
    });
    this.statisticsSlider!.disabled = true;
  }

  initHtml(): string {
    return `
        <style>
        :host{
            display: block;
            width: 100%;
            border-radius: 0px 16px 16px 0px;
            height: 100%;
        }
        .title {
            grid-column: span 2 / auto;
        }
        .allocation-font-style{
            font-family: Helvetica-Bold;
            font-size: 1em;
            color: var(--dark-color1,#000000);
            line-height: 28px;
            font-weight: 700;
        }
        .root {
            padding-top: 45px;
            margin-left: 40px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: min-content 1fr min-content;
            width: 90%;
            border-radius: 0px 16px 16px 0px;
        }
        .allocation-inner-font-style {
            font-family: Helvetica,serif;
            font-size: 1em;
            color: var(--dark-color1,#000000);
            text-align: left;
            line-height: 20px;
            font-weight: 400;
            display:flex;
            width:75%; 
            margin-top: 3px;
           
        }
        input {
           width: 72%;
           height: 25px;
           border:0;
           outline:none;
           border-radius: 16px;
           text-indent:2%
        }
        input::-webkit-input-placeholder{
            color:var(--bark-prompt,#999999);
        }
        .allocation-select {
            height: 30px;
            border:0;
            border-radius: 3px;
            outline:none;
            border: 1px solid var(--dark-border,#B3B3B3);
            width: 60px;
            background-color:var(--dark-background5, #FFFFFF)
            font-family: Helvetica;
            font-size: 14px;
            color:var(--dark-color,#212121)
            text-align: center;
            line-height: 16px;
            font-weight: 400;
            border-radius: 16px;
        }
        .allocation-application{
           display: flex;
           flex-direction: column;
           grid-gap: 15px;
           margin-top: 40px;
        }
        .allocation-switchstyle{
           margin-top: 40px;
           display: flex;
        }
        .allocation-inputstyle{
            background: var(--dark-background5,#FFFFFF);
            border: 1px solid var(--dark-background5,#ccc);
            font-family: Helvetica;
            font-size: 14px;
            color: var(--dark-color1,#212121);
            text-align: left;
            line-height: 16px;
            font-weight: 400;
        }

        input::-webkit-input-placeholder{
          background: var(--dark-background5,#FFFFFF);
        }
        
        :host([startSamp]) .allocation-inputstyle {
            background: var(--dark-background5,#FFFFFF);
        }
        
        :host(:not([startSamp])) .allocation-inputstyle {
            color: #b7b7b7;
            background: var(--dark-background1,#f5f5f5);
        }
        
        #one_mb{
            background-color:var(--dark-background5, #FFFFFF)
        }
        #one_kb{
            background-color:var(--dark-background5, #FFFFFF)
        }
        #two_mb{
            background-color:var(--dark-background5, #FFFFFF)
        }
        #two_kb{
            background-color:var(--dark-background5, #FFFFFF)
        }
        .processSelect {
          border-radius: 15px;
          width: 84%;
        }
        .value-range {
          opacity: 0.6;
          font-family: Helvetica;
          font-size: 1em;
          color: var(--dark-color,#000000);
          text-align: left;
          line-height: 20px;
          font-weight: 400;
        }
        .record-title{
            margin-bottom: 16px;
            grid-column: span 3;
        }
        #interval-slider {
            margin: 0 8px;
            grid-column: span 2;
        }
        .resultSize{
            display: grid;
            grid-template-rows: 1fr;
            grid-template-columns:  min-content min-content;
            background-color: var(--dark-background5,#F2F2F2);
            -webkit-appearance:none;
            color:var(--dark-color,#6a6f77);
            width: 150px;
            margin: 0 30px 0 0;
            height: 40px;
            border-radius:20px;
            outline:0;
            border:1px solid var(--dark-border,#c8cccf);
        }
        .record-mode{
            font-family: Helvetica-Bold;
            font-size: 1em;
            color: var(--dark-color1,#000000);
            line-height: 28px;
            font-weight: 400;
            margin-bottom: 16px;
            grid-column: span 1;
        }
        .allocation-record-prompt{
              opacity: 0.6;
              font-family: Helvetica;
              font-size: 14px;
              text-align: center;
              line-height: 35px;
              font-weight: 400;
        }
        .interval-result{
            -webkit-appearance:none;
            border: none;
            text-align: center;
            width: 90px;
            font-size:14px;
            outline:0;
            margin: 5px 0 5px 5px;
            background-color: var(--dark-background5,#F2F2F2);
            color:var(--dark-color,#6a6f77);
        }
        
        .allocation-title {
          opacity: 0.9;
          font-family: Helvetica-Bold;
          margin-right: 10px;
          font-size: 18px;
          text-align: center;
          line-height: 40px;
          font-weight: 700;
        }
        
        lit-switch {
          height: 38px;
          margin-top: 10px;
          display:inline;
          float: right;
        }
        
        </style>
        <div class="root">
          <div class = "title" style="width: 92%;margin-top: 5vh;">
            <span class="allocation-title">Start Native Memory Record</span>
            <lit-switch id="startNativeMemoryRecord"></lit-switch>
          </div>
          <div class="allocation-application">
             <span class="allocation-inner-font-style">ProcessId or ProcessName</span>
             <span class="value-range">Record process</span>
             <lit-allocation-select show-search class="processSelect" rounded default-value="" id="pid" placement="bottom" title="process" placeholder="please select process">
             </lit-allocation-select>
          </div>
          <div class="allocation-application">
            <span class="allocation-inner-font-style" >Max unwind level</span>
            <span class="value-range">Max Unwind Level Rang is 0 - 512, default 10</span>
            <input id= "unwind"  class="allocation-inputstyle inputBoxes" type="text" placeholder="Enter the Max Unwind Level" oninput="if(this.value > 512) this.value = '512'" onkeyup="this.value=this.value.replace(/\\D/g,'')" value="10">
          </div>
          <div class="allocation-application">
            <span class="allocation-inner-font-style">Shared Memory Size (One page equals 4 KB)</span>
            <span class="value-range">Shared Memory Size Range is 0 - 131072 page, default 16384 page</span>
            <div>
              <input id = "shareMemory" class="allocation-inputstyle inputBoxes" type="text" placeholder="Enter the Shared Memory Size" oninput="if(this.value > 131072) this.value = '131072'" onkeyup="this.value=this.value.replace(/\\D/g,'')" value="16384">
              <span>Page</span>
            </div>
          </div>
          <div class="allocation-application">
            <span class="allocation-inner-font-style" >Filter Memory Size </span>
            <span class="value-range">Filter size Range is 0 - 65535 byte, default 0 byte</span> 
            <div>
                <input id = "filterSized" class="allocation-inputstyle inputBoxes" type="text" placeholder="Enter the Filter Memory Size" oninput="if(this.value > 65535) this.value = '65535'" onkeyup="this.value=this.value.replace(/\\D/g,'')" value="0">
                 <span>Byte</span>
            </div>
          </div>
          <div class="allocation-switchstyle">
              <span class="allocation-inner-font-style" id="fp-unwind">Use Fp Unwind</span>               
              <lit-switch class="lts" id="use_fp_unwind" title="fp unwind" checked="true"></lit-switch>
          </div>
          <div class="allocation-switchstyle version-controller">
              <span class="allocation-inner-font-style" id="record_accurately ">Use Record Accurately (Available on recent OpenHarmony 4.0)</span> 
              <lit-switch   class="lts" id="use_record_accurately" title="record_accurately" checked="true"></lit-switch>
          </div>
          <div class="allocation-switchstyle version-controller">
              <span class="allocation-inner-font-style" id="offline_symbolization">Use Offline Symbolization (Available on recent OpenHarmony 4.0)</span> 
              <lit-switch class="lts" id="use_offline_symbolization" title="offline_symbolization" checked="true"></lit-switch>
          </div>
           <div class="allocation-switchstyle version-controller">
              <span class="allocation-inner-font-style" id="startup_mode">Use Startup Mode (Available on recent OpenHarmony 4.0)</span> 
              <lit-switch class="lts" id="use_startup_mode" title="startup_mode"></lit-switch>
          </div>   
          <div class="allocation-switchstyle record-statistics-result version-controller" style="grid-row: 6; grid-column: 1 / 3;height: min-content;display: grid;grid-template-rows: 1fr;grid-template-columns: 1fr min-content;">
            <div class="record-title">
                <span class="record-mode">Use Record Statistics (Available on recent OpenHarmony 4.0)</span> 
                <span class="allocation-record-prompt"> Time between following interval (0 = disabled) </span>
            </div>
            <lit-slider id="interval-slider" defaultColor="var(--dark-color3,#46B1E3)" open dir="right">
            </lit-slider>
            <div class='resultSize'>
                <input class="interval-result inputBoxes" type="text" value='0' onkeyup="this.value=this.value.replace(/\\D/g,'')">
                <span style="text-align: center; margin: 8px"> S </span>
            </div>
          </div>
        </div>
        `;
  }

}
