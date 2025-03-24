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

import { LitTableColumn } from './lit-table-column.js';
import { LitProgressBar } from './../progress-bar/LitProgressBar.js';
import { BaseElement, element } from '../BaseElement.js';
import '../utils/Template.js';
import { TableRowObject } from './TableRowObject.js';
import { JSONToCSV } from '../utils/CSVFormater.js';

@element('lit-page-table')
export class LitPageTable extends BaseElement {
  meauseRowElement: HTMLDivElement | undefined;
  currentRecycleList: HTMLDivElement[] = [];
  currentTreeDivList: HTMLDivElement[] = [];
  public rememberScrollTop = false;
  public getItemTextColor?: (data: any) => string;
  public itemTextHandleMap: Map<string, (value: any) => string> = new Map<string, (value: any) => string>();
  private ds: Array<any> = [];
  public recycleDs: Array<any> = [];
  private gridTemplateColumns: Array<string> = [];
  private st: HTMLSlotElement | null | undefined;
  private tableElement: HTMLDivElement | null | undefined;
  private exportProgress: LitProgressBar | null | undefined;
  private theadElement: HTMLDivElement | null | undefined;
  private columns: Array<Element> | null | undefined;
  private tbodyElement: HTMLDivElement | undefined | null;
  private treeElement: HTMLDivElement | undefined | null;
  private previousDiv: HTMLDivElement | undefined | null;
  private nextDiv: HTMLDivElement | undefined | null;
  private currentPageDiv: HTMLDivElement | undefined | null;
  private targetPageInput: HTMLInputElement | undefined | null;
  private jumpDiv: HTMLDivElement | undefined | null;
  private tableColumns: NodeListOf<LitTableColumn> | undefined;
  private colCount: number = 0;
  private currentScrollTop: number = 0;
  private isScrollXOutSide: boolean = false;
  private exportLoading: boolean = false;
  private currentPage: number = 0;
  private _loading: boolean = false;

  static get observedAttributes() {
    return [
      'scroll-y',
      'selectable',
      'no-head',
      'grid-line',
      'defaultOrderColumn',
      'hideDownload',
      'loading',
      'pagination',
    ];
  }

  set loading(value: boolean) {
    this._loading = value;
    this.exportProgress!.loading = value;
  }

  get hideDownload() {
    return this.hasAttribute('hideDownload');
  }

  set hideDownload(value) {
    if (value) {
      this.setAttribute('hideDownload', '');
    } else {
      this.removeAttribute('hideDownload');
    }
  }

  get selectable() {
    return this.hasAttribute('selectable');
  }

  set selectable(value) {
    if (value) {
      this.setAttribute('selectable', '');
    } else {
      this.removeAttribute('selectable');
    }
  }

  get scrollY() {
    return this.getAttribute('scroll-y') || 'auto';
  }

  set scrollY(value) {
    this.setAttribute('scroll-y', value);
  }
  get recycleDataSource() {
    return this.ds || [];
  }

  set recycleDataSource(value) {
    this.isScrollXOutSide = this.tableElement!.scrollWidth > this.tableElement!.clientWidth;
    this.ds = value;
    this.toTop();
    this.currentPage = 0;
    this.pagination = value.length > 0 && Array.isArray(value[0]);
    if (this.pagination) {
      this.currentPageDiv!.textContent = `第 ${this.currentPage + 1} 页，共 ${this.ds.length} 页`;
      this.targetPageInput!.value = '';
    }
    if (this.hasAttribute('tree')) {
      this.recycleDs = this.meauseTreeRowElement(value);
    } else {
      this.recycleDs = this.meauseAllRowHeight(this.pagination ? value[0] : value);
    }
  }

  set pagination(value: boolean) {
    if (value) {
      this.setAttribute('pagination', '');
    } else {
      this.removeAttribute('pagination');
    }
  }

  get pagination() {
    return this.hasAttribute('pagination');
  }

  initElements(): void {
    this.st = this.shadowRoot?.querySelector('#slot');
    this.tableElement = this.shadowRoot?.querySelector('.table');
    this.exportProgress = this.shadowRoot?.querySelector('#export_progress_bar');
    this.theadElement = this.shadowRoot?.querySelector('.thead');
    this.treeElement = this.shadowRoot?.querySelector('.tree');
    this.tbodyElement = this.shadowRoot?.querySelector('.body');
    this.tableColumns = this.querySelectorAll<LitTableColumn>('lit-table-column');
    this.previousDiv = this.shadowRoot?.querySelector<HTMLDivElement>('#previousPage');
    this.nextDiv = this.shadowRoot?.querySelector<HTMLDivElement>('#nextPage');
    this.currentPageDiv = this.shadowRoot?.querySelector<HTMLDivElement>('#currentPage');
    this.targetPageInput = this.shadowRoot?.querySelector<HTMLInputElement>('#targetPage');
    this.jumpDiv = this.shadowRoot?.querySelector<HTMLDivElement>('#jumpPage');
    this.previousDiv!.onclick = () => {
      if (this.currentPage > 0) {
        this.currentPage = Math.max(this.currentPage - 1, 0);
        this.showCurrentPageData();
      }
    };
    this.nextDiv!.onclick = () => {
      if (this.currentPage < this.ds.length - 1) {
        this.currentPage = Math.min(this.currentPage + 1, this.ds.length - 1);
        this.showCurrentPageData();
      }
    };
    this.jumpDiv!.onclick = () => {
      let value = this.targetPageInput!.value;
      let reg = /^[0-9]*$/;
      if (value.length > 0 && reg.test(value)) {
        let target = parseInt(value);
        if (target < 1) {
          target = 1;
        }
        if (target > this.ds.length) {
          target = this.ds.length;
        }
        this.targetPageInput!.value = `${target}`;
        if (this.currentPage !== target - 1) {
          this.currentPage = target - 1;
          this.showCurrentPageData();
        }
      } else {
        this.targetPageInput!.value = '';
      }
    };
  }

  toTop() {
    if (this.rememberScrollTop) {
      this.currentScrollTop = this.tableElement!.scrollTop;
      this.tableElement!.scrollTop = 0;
      this.tableElement!.scrollLeft = 0;
    } else {
      this.tableElement!.scrollTop = 0;
      this.tableElement!.scrollLeft = 0;
    }
  }

  showCurrentPageData() {
    this.toTop();
    this.currentPageDiv!.textContent = `第 ${(this.currentPage || 0) + 1} 页，共 ${this.ds.length} 页`;
    if (this.hasAttribute('tree')) {
      this.recycleDs = this.meauseTreeRowElement(this.ds[this.currentPage]);
    } else {
      this.recycleDs = this.meauseAllRowHeight(this.ds[this.currentPage]);
    }
  }

  initHtml(): string {
    return `
        <style>
        :host{
            display: grid;
            grid-template-columns: repeat(1,1fr);
            width: 100%;
            position: relative;
            font-weight: 500;
            flex:1;
        }
        .tr{
            display: grid;
            grid-column-gap: 5px;
            min-width:100%;
        }
        .tr:nth-of-type(even){
        }
        .tr{
            background-color: var(--dark-background,#FFFFFF);
        }
        .tr:hover{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .tr[selected]{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .tr[high-light]{
            font-weight: 600;
        }
        .td{
            box-sizing: border-box;
            padding: 3px;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            width: 100%;
            height: auto;
            cursor: pointer;
        }
        .td label{
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: normal;
        }
        .td text{
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: nowrap;
        }
        .td-order{
        }
        .td-order:before{

        }
        :host([grid-line]) .td{
            border-left: 1px solid #f0f0f0;
        }
        :host([grid-line]) .td:last-of-type{
            border-right: 1px solid #f0f0f0;
        }
        .table{
            width: 100%;
             color: var(--dark-color2,#262626);
        }
        .thead{
            display: grid;
            position: sticky;
            top: 0;
            font-weight: bold;
            font-size: .9rem;
            color: var(--dark-color1,#000);
            background-color: var(--dark-background,#FFFFFF);
            z-index: 1;
        }
        .tbody{
            width: 100%;
            top: 0;
            left: 0;
            right:0;
            bottom:0;
            padding-bottom: 30px;
            display: flex;
            flex-direction: row
            row-gap: 1px;
            column-gap: 1px;
        }
        .tbottom{
            height: 30px;
            width: calc(100% - 15px);
            position: absolute;
            bottom: 0;
            z-index: 1;
            justify-content: center;
            align-items: center;
            display: none;
            flex-direction: row;
            color: var(--dark-color1,#000);
            background-color: var(--dark-background,#FFFFFF);
        }
        :host([pagination]) .tbottom{
            display: flex;
        }
        .tree{
            overflow-x:hidden;
            overflow-y:hidden;
            display: grid;
            grid-template-columns: 1fr;
            row-gap: 1px;
            column-gap: 1px;
            position:relative;
        }
        .tree:hover{
            overflow-x: overlay;
        }
        .tree-first-body{
            min-width: 100%;
            box-sizing: border-box;
            display:flex;
            align-items:center;
            white-space: nowrap;
            font-weight: 500;
            cursor: pointer;
        }
        .tree-first-body[high-light]{
            font-weight: 600;
        }
        .tree-first-body:hover{
            background-color: var(--dark-background6,#DEEDFF); /*antd #fafafa 42b983*/
        }
        .body{
            display: grid;
            grid-template-columns: 1fr;
            row-gap: 1px;
            column-gap: 1px;
            flex:1;
            position: relative;
        }
        :host([grid-line])  .tbody{
            border-bottom: 1px solid #f0f0f0;
            background-color: #f0f0f0;
        }
        .th{
            grid-column-gap: 5px;
            display: grid;
            background-color: var(--dark-background,#FFFFFF);
        }

        .tree-icon{
            font-size: 1.2rem;
            width: 20px;
            height: 20px;
            padding-right: 5px;
            padding-left: 5px;
            cursor: pointer;
        }
        .tree-icon:hover{
            color: #42b983;
        }
        .row-checkbox,row-checkbox-all{

        }
        :host([no-head]) .thead{
            display: none;
        }
        .up-svg{
            position: absolute;
            right: 5px;
            top: 8px;
            bottom: 8px;
            width: 15px;
            height: 15px;
        }
        .down-svg{
            position: absolute;
            top: 8px;
            right: 5px;
            bottom: 8px;
            width: 15px;
            height: 15px;
        }
        .mouse-select{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .mouse-in{
            background-color: var(--dark-background6,#DEEDFF);
        }
        .export{
            height:32px;
            width: 32px;
            cursor:pointer;
            display:none;
            align-items:center;
            justify-content:center;
            border-radius:5px;
            box-sizing: border-box;
            background-color: #000000;
            opacity: 0.3;
            position:absolute;
            right:20px;
            bottom:20px;
            z-index: 999999;
        }
        .resize{
            width: 2px;
            margin-right: 3px;
            height: 20px;
            background-color: #e0e0e0;
            cursor: col-resize;
        }
       
        .progress{
            position: absolute;
            height: 1px;
            top: 0;
            left: 0;
            right: 0;
            z-index: 999999;
        } 
        :host([hideDownload]) .export{
            display: none;
        }
        </style>
        <lit-progress-bar id="export_progress_bar" class="progress"></lit-progress-bar>
        <slot id="slot" style="display: none"></slot>
        <slot name="head"></slot>
        <div class="export">
            <lit-icon size="18" style="color: #ffffff" name="copyhovered" ></lit-icon>
        </div>
        <div class="table" style="overflow-x:auto;">
            <div class="thead"></div>
            <div class="tbody">
                <div class="tree"></div>
                <div class="body"></div>
            </div>
            <div class="tbottom">
                <div id="previousPage" style="cursor: pointer">上一页</div>
                <div id="currentPage" style="margin-left: 10px;margin-right: 10px">1</div>
                <input id="targetPage" style="width: 60px;margin-right: 10px" min="1" type="number"/>
                <div id="jumpPage" style="padding: 2px 10px;border: 1px solid #676767;margin-right: 10px;font-size: 13px;cursor: pointer">GO</div>
                <div id="nextPage" style="cursor: pointer">下一页</div>
            </div>
        </div>
        `;
  }

  move1px() {
    this.tableElement!.scrollTop = this.tableElement!.scrollTop + 1;
  }

  dataExportInit() {
    let exportDiv = this.shadowRoot!.querySelector<HTMLDivElement>('.export');
    exportDiv &&
      (exportDiv.onclick = () => {
        this.exportData();
      });
  }

  exportData() {
    if (this.exportLoading || this.ds.length === 0) {
      return;
    }
    this.exportLoading = true;
    this.exportProgress!.loading = true;
    let date = new Date();
    JSONToCSV.csvExport({
      columns: this.columns as any[],
      tables: this.ds,
      fileName: date.getTime() + '',
    }).then((res) => {
      this.exportLoading = false;
      this.exportProgress!.loading = false;
    });
  }

  formatExportData(dataSource: any[]): any[] {
    if (dataSource == undefined || dataSource.length == 0) {
      return [];
    }
    if (this.columns == undefined) {
      return [];
    }
    return dataSource.map((item) => {
      let formatData: any = {};
      this.columns!.forEach((column) => {
        let dataIndex = column.getAttribute('data-index');
        let columnName = column.getAttribute('title');
        if (columnName == '') {
          columnName = dataIndex;
        }
        if (dataIndex && columnName && item[dataIndex] != undefined) {
          formatData[columnName] = item[dataIndex];
        }
      });
      if (item.children != undefined) {
        formatData.children = this.formatExportData(item.children);
      }
      return formatData;
    });
  }

  recursionExportTableData(columns: any[], dataSource: any[]): string {
    let concatStr = '\r\n';
    dataSource.forEach((item, index) => {
      concatStr += columns
        .map((column) => {
          let dataIndex = column.getAttribute('data-index');
          return `"${item[dataIndex] || ''}"    `;
        })
        .join(',');
      if (item.children != undefined) {
        concatStr += this.recursionExportTableData(columns, item.children);
      }
      if (index != dataSource.length - 1) {
        concatStr += '\r\n';
      }
    });
    return concatStr;
  }

  //当 custom element首次被插入文档DOM时，被调用。
  connectedCallback() {
    this.colCount = this.tableColumns!.length;
    this.dataExportInit();
    this.tableElement?.addEventListener('copy', (e) => {
      // @ts-ignore
      let clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;
      // @ts-ignore
      let text = window.getSelection().toString();
      if (text) {
        e.preventDefault();
        let length = this.tableColumns?.length || 1;
        let strings = text.split('\n');
        let formatStr = '';
        for (let i = 0; i < strings.length; i++) {
          if (i % length != 0) {
            formatStr += '    ';
          }
          formatStr += strings[i];
          if (i != 0 && i % length == length - 1) {
            formatStr += '\n';
          }
        }
        clipboardData.setData('text/plain', formatStr);
      }
    });
    this.st?.addEventListener('slotchange', () => {
      this.theadElement!.innerHTML = '';
      setTimeout(() => {
        this.columns = this.st!.assignedElements();
        let rowElement = document.createElement('div');
        rowElement.classList.add('th');
        if (this.selectable) {
          let box = document.createElement('div');
          box.style.display = 'flex';
          box.style.justifyContent = 'center';
          box.style.alignItems = 'center';
          box.style.gridArea = '_checkbox_';
          box.classList.add('td');
          box.style.backgroundColor = '#ffffff66';
          let checkbox = document.createElement('lit-checkbox');
          checkbox.classList.add('row-checkbox-all');
          checkbox.onchange = (e: any) => {
            this.shadowRoot!.querySelectorAll('.row-checkbox').forEach((a: any) => (a.checked = e.detail.checked));
            if (e.detail.checked) {
              this.shadowRoot!.querySelectorAll('.tr').forEach((a) => a.setAttribute('checked', ''));
            } else {
              this.shadowRoot!.querySelectorAll('.tr').forEach((a) => a.removeAttribute('checked'));
            }
          };
          box.appendChild(checkbox);
          rowElement.appendChild(box);
        }
        let area: Array<any> = [];
        this.gridTemplateColumns = [];
        let resolvingArea = (columns: any, x: any, y: any) => {
          columns.forEach((a: any, i: any) => {
            if (!area[y]) area[y] = [];
            let key = a.getAttribute('key') || a.getAttribute('title');
            if (a.tagName === 'LIT-TABLE-GROUP') {
              let len = a.querySelectorAll('lit-table-column').length;
              let children = [...a.children].filter((a) => a.tagName !== 'TEMPLATE');
              if (children.length > 0) {
                resolvingArea(children, x, y + 1);
              }
              for (let j = 0; j < len; j++) {
                area[y][x] = { x, y, t: key };
                x++;
              }
              let h = document.createElement('div');
              h.classList.add('td');
              h.style.justifyContent = a.getAttribute('align');
              h.style.borderBottom = '1px solid #f0f0f0';
              h.style.gridArea = key;
              h.innerText = a.title;
              if (a.hasAttribute('fixed')) {
                this.fixed(h, a.getAttribute('fixed'), '#42b983');
              }
              rowElement.append(h);
            } else if (a.tagName === 'LIT-TABLE-COLUMN') {
              area[y][x] = { x, y, t: key };
              x++;
              let h: any = document.createElement('div');
              h.classList.add('td');
              if (i > 0) {
                let resizeDiv: HTMLDivElement = document.createElement('div');
                resizeDiv.classList.add('resize');
                h.appendChild(resizeDiv);
                this.resizeEventHandler(rowElement, resizeDiv, i);
              }
              if (a.hasAttribute('order')) {
                h.sortType = 0;
                h.classList.add('td-order');
                h.style.position = 'relative';
                let NS = 'http://www.w3.org/2000/svg';
                let upSvg: any = document.createElementNS(NS, 'svg');
                let upPath: any = document.createElementNS(NS, 'path');
                upSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
                upSvg.setAttribute('viewBox', '0 0 1024 1024');
                upSvg.setAttribute('stroke', 'let(--dark-color1,#212121)');
                upSvg.classList.add('up-svg');
                upPath.setAttribute(
                  'd',
                  'M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z'
                );
                upSvg.appendChild(upPath);
                let downSvg: any = document.createElementNS(NS, 'svg');
                let downPath: any = document.createElementNS(NS, 'path');
                downSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
                downSvg.setAttribute('viewBox', '0 0 1024 1024');
                downSvg.setAttribute('stroke', 'let(--dark-color1,#212121)');
                downSvg.classList.add('down-svg');
                downPath.setAttribute(
                  'd',
                  'M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z'
                );
                downSvg.appendChild(downPath);
                if (i == 0) {
                  h.sortType = 0; // 默认以第一列 降序排序 作为默认排序
                  upSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
                  downSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
                }
                upSvg.style.display = 'none';
                downSvg.style.display = 'none';
                h.appendChild(upSvg);
                h.appendChild(downSvg);
                h.onclick = () => {
                  if (this.isResize || this.resizeColumnIndex !== -1) {
                    return;
                  }
                  this?.shadowRoot?.querySelectorAll('.td-order svg').forEach((it: any) => {
                    it.setAttribute('fill', 'let(--dark-color1,#212121)');
                    it.sortType = 0;
                    it.style.display = 'none';
                  });
                  if (h.sortType == undefined || h.sortType == null) {
                    h.sortType = 0;
                  } else if (h.sortType === 2) {
                    h.sortType = 0;
                  } else {
                    h.sortType += 1;
                  }
                  switch (h.sortType) {
                    case 1:
                      this.theadElement!.setAttribute('sort', '');
                      upSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
                      downSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
                      upSvg.style.display = 'block';
                      downSvg.style.display = 'none';
                      break;
                    case 2:
                      upSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
                      downSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
                      upSvg.style.display = 'none';
                      downSvg.style.display = 'block';
                      break;
                    default:
                      upSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
                      downSvg.setAttribute('fill', 'let(--dark-color1,#212121)');
                      upSvg.style.display = 'none';
                      downSvg.style.display = 'none';
                      this.theadElement!.removeAttribute('sort');
                      break;
                  }
                  this.dispatchEvent(
                    new CustomEvent('column-click', {
                      detail: {
                        sort: h.sortType,
                        key: key,
                      },
                      composed: true,
                    })
                  );
                };
              }
              h.style.justifyContent = a.getAttribute('align');
              this.gridTemplateColumns.push(a.getAttribute('width') || '1fr');
              h.style.gridArea = key;
              let titleLabel = document.createElement('label');
              titleLabel.textContent = a.title;
              h.appendChild(titleLabel);
              if (a.hasAttribute('fixed')) {
                this.fixed(h, a.getAttribute('fixed'), '#42b983');
              }
              rowElement.append(h);
            }
          });
        };
        resolvingArea(this.columns, 0, 0);
        area.forEach((rows, j, array) => {
          for (let i = 0; i < this.colCount; i++) {
            if (!rows[i]) rows[i] = array[j - 1][i];
          }
        });
        if (this.selectable) {
          let s = area.map((a) => '"_checkbox_ ' + a.map((aa: any) => aa.t).join(' ') + '"').join(' ');
          rowElement.style.gridTemplateColumns = '60px ' + this.gridTemplateColumns.join(' ');
          rowElement.style.gridTemplateRows = `repeat(${area.length},1fr)`;
          rowElement.style.gridTemplateAreas = s;
        } else {
          let s = area.map((a) => '"' + a.map((aa: any) => aa.t).join(' ') + '"').join(' ');
          rowElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
          rowElement.style.gridTemplateRows = `repeat(${area.length},1fr)`;
          rowElement.style.gridTemplateAreas = s;
        }
        this.theadElement!.innerHTML = '';
        this.theadElement!.append(rowElement);
        this.treeElement!.style.top = this.theadElement?.clientHeight + 'px';
      });
    });
    this.shadowRoot!.addEventListener('load', function (event) {});
    this.tableElement!.addEventListener('mouseout', (ev) => this.mouseOut());
  }

  private isResize: boolean = false;
  private resizeColumnIndex: number = -1;
  private resizeDownX: number = 0;
  private columnMinWidth: number = 50;
  private beforeResizeWidth1: number = 0;
  private beforeResizeWidth2: number = 0;
  resizeEventHandler(header: HTMLDivElement, element: HTMLDivElement, index: number) {
    header.addEventListener('mousemove', (event) => {
      if (this.isResize) {
        let width = event.clientX - this.resizeDownX;
        header.style.cursor = 'col-resize';
        let preWidth = this.beforeResizeWidth1,
          nowWidth = this.beforeResizeWidth2;
        if (width < 0) {
          preWidth = Math.max(this.beforeResizeWidth1 + width, this.columnMinWidth);
          nowWidth = this.beforeResizeWidth1 - preWidth + this.beforeResizeWidth2;
        }
        if (width > 0) {
          nowWidth = Math.max(this.beforeResizeWidth2 - width, this.columnMinWidth);
          preWidth = this.beforeResizeWidth2 - nowWidth + this.beforeResizeWidth1;
        }
        this.gridTemplateColumns[this.resizeColumnIndex - 1] = `${preWidth}px`;
        this.gridTemplateColumns[this.resizeColumnIndex] = `${nowWidth}px`;
        header.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
        this.shadowRoot!.querySelectorAll<HTMLDivElement>('.tr').forEach((tr) => {
          tr.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
        });
        event.preventDefault();
        event.stopPropagation();
      } else {
        header.style.cursor = 'pointer';
      }
    });
    header.addEventListener('mouseup', (event) => {
      this.isResize = false;
      this.resizeDownX = 0;
      header.style.cursor = 'pointer';
      setTimeout(() => {
        this.resizeColumnIndex = -1;
      }, 100);
      event.stopPropagation();
      event.preventDefault();
    });
    header.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
      event.preventDefault();
      this.isResize = false;
      this.resizeDownX = 0;
      this.resizeColumnIndex = -1;
      header.style.cursor = 'pointer';
    });
    element.addEventListener('mousedown', (event) => {
      this.isResize = true;
      this.resizeColumnIndex = index;
      this.resizeDownX = event.clientX;
      let pre = header.childNodes.item(this.resizeColumnIndex - 1) as HTMLDivElement;
      let now = header.childNodes.item(this.resizeColumnIndex) as HTMLDivElement;
      this.beforeResizeWidth1 = pre.clientWidth;
      this.beforeResizeWidth2 = now.clientWidth;
      event.stopPropagation();
    });
    element.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }

  // Is called when the custom element is removed from the document DOM.
  disconnectedCallback() {}

  // It is called when the custom element is moved to a new document.
  adoptedCallback() {}

  // It is called when a custom element adds, deletes, or modifies its own properties.
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {}

  fixed(td: HTMLElement, placement: string, bgColor: string) {
    td.style.position = 'sticky';
    if (placement === 'left') {
      td.style.left = '0px';
      td.style.boxShadow = '3px 0px 5px #33333333';
    } else if (placement === 'right') {
      td.style.right = '0px';
      td.style.boxShadow = '-3px 0px 5px #33333333';
    }
  }

  getCheckRows() {
    // @ts-ignore
    return [...this.shadowRoot!.querySelectorAll('div[class=tr][checked]')]
      .map((a) => (a as any).data)
      .map((a) => {
        delete a['children'];
        return a;
      });
  }

  deleteRowsCondition(fn: any) {
    this.shadowRoot!.querySelectorAll('div[class=tr]').forEach((tr) => {
      // @ts-ignore
      if (fn(tr.data)) {
        tr.remove();
      }
    });
  }

  meauseElementHeight(rowData: any) {
    return 27;
  }

  meauseTreeElementHeight(rowData: any, depth: number) {
    return 27;
  }

  meauseAllRowHeight(list: any[]): TableRowObject[] {
    this.tbodyElement!.innerHTML = '';
    this.meauseRowElement = undefined;
    let head = this.shadowRoot!.querySelector('.th');
    this.tbodyElement && (this.tbodyElement.style.width = head?.clientWidth + 'px');
    this.currentRecycleList = [];
    let headHeight = 0;
    let totalHeight = headHeight;
    let visibleObjects: TableRowObject[] = [];
    let itemHandler = (rowData: any, index: number) => {
      let height = this.meauseElementHeight(rowData);
      let tableRowObject = new TableRowObject();
      tableRowObject.height = height;
      tableRowObject.top = totalHeight;
      tableRowObject.data = rowData;
      tableRowObject.rowIndex = index;
      if (
        Math.max(totalHeight, this.tableElement!.scrollTop + headHeight) <=
        Math.min(totalHeight + height, this.tableElement!.scrollTop + this.tableElement!.clientHeight + headHeight)
      ) {
        let newTableElement = this.createNewTableElement(tableRowObject);
        newTableElement.style.transform = `translateY(${totalHeight}px)`;
        this.tbodyElement?.append(newTableElement);
        this.currentRecycleList.push(newTableElement);
      }
      totalHeight += height;
      visibleObjects.push(tableRowObject);
    };
    let realIndex = 0;
    list.forEach((item, index) => {
      if (Array.isArray(item)) {
        item.forEach((rowData, childIndex) => {
          itemHandler(rowData, realIndex);
          realIndex++;
        });
      } else {
        itemHandler(item, index);
      }
    });
    this.tbodyElement && (this.tbodyElement.style.height = totalHeight + (this.isScrollXOutSide ? 0 : 0) + 'px');
    this.tableElement &&
      (this.tableElement.onscroll = (event) => {
        let tblScrollTop = this.tableElement!.scrollTop;
        let skip = 0;
        for (let i = 0; i < visibleObjects.length; i++) {
          if (
            visibleObjects[i].top <= tblScrollTop &&
            visibleObjects[i].top + visibleObjects[i].height >= tblScrollTop
          ) {
            skip = i;
            break;
          }
        }
        let reduce = this.currentRecycleList.map((item) => item.clientHeight).reduce((a, b) => a + b, 0);
        if (reduce == 0) {
          return;
        }
        while (reduce <= this.tableElement!.clientHeight) {
          let newTableElement = this.createNewTableElement(visibleObjects[skip]);
          this.tbodyElement?.append(newTableElement);
          this.currentRecycleList.push(newTableElement);
          reduce += newTableElement.clientHeight;
        }
        for (let i = 0; i < this.currentRecycleList.length; i++) {
          this.freshCurrentLine(this.currentRecycleList[i], visibleObjects[i + skip]);
        }
      });
    return visibleObjects;
  }

  meauseTreeRowElement(list: any[]): TableRowObject[] {
    this.meauseRowElement = undefined;
    this.tbodyElement!.innerHTML = '';
    this.treeElement!.innerHTML = '';
    let headHeight = this.theadElement?.clientHeight || 0;
    let totalHeight = 0;
    let visibleObjects: TableRowObject[] = [];
    this.currentRecycleList = [];
    this.currentTreeDivList = [];
    let resetAllHeight = (list: any[], depth: number, parentNode?: TableRowObject) => {
      list.forEach((item) => {
        let tableRowObject = new TableRowObject();
        tableRowObject.depth = depth;
        tableRowObject.data = item;
        tableRowObject.top = totalHeight;
        tableRowObject.height = this.meauseTreeElementHeight(tableRowObject, depth);
        if (parentNode != undefined) {
          parentNode.children.push(tableRowObject);
        }
        if (
          Math.max(totalHeight, this.tableElement!.scrollTop) <=
          Math.min(
            totalHeight + tableRowObject.height,
            this.tableElement!.scrollTop + this.tableElement!.clientHeight - headHeight
          )
        ) {
          let newTableElement = this.createNewTreeTableElement(tableRowObject);
          newTableElement.style.transform = `translateY(${totalHeight}px)`;
          this.tbodyElement?.append(newTableElement);
          if (this.treeElement?.lastChild) {
            (this.treeElement?.lastChild as HTMLElement).style.height = tableRowObject.height + 'px';
          }
          this.currentRecycleList.push(newTableElement);
        }
        totalHeight += tableRowObject.height;
        visibleObjects.push(tableRowObject);
        if (item.hasNext) {
          if (item.parents != undefined && item.parents.length > 0 && item.status) {
            resetAllHeight(item.parents, depth + 1, tableRowObject);
          } else if (item.children != undefined && item.children.length > 0 && item.status) {
            resetAllHeight(item.children, depth + 1, tableRowObject);
          }
        } else {
          if (item.children != undefined && item.children.length > 0) {
            resetAllHeight(item.children, depth + 1, tableRowObject);
          }
        }
      });
    };
    resetAllHeight(list, 0);
    this.tbodyElement && (this.tbodyElement.style.height = totalHeight + 'px');
    this.treeElement!.style.height = this.tableElement!.clientHeight - this.theadElement!.clientHeight + 'px';
    this.tableElement &&
      (this.tableElement.onscroll = (event) => {
        let visibleObjects = this.recycleDs.filter((item) => {
          return !item.rowHidden;
        });
        let top = this.tableElement!.scrollTop;
        this.treeElement!.style.transform = `translateY(${top}px)`;
        let skip = 0;
        for (let index = 0; index < visibleObjects.length; index++) {
          if (visibleObjects[index].top <= top && visibleObjects[index].top + visibleObjects[index].height >= top) {
            skip = index;
            break;
          }
        }
        let reduce = this.currentRecycleList.map((item) => item.clientHeight).reduce((a, b) => a + b, 0);
        if (reduce == 0) {
          return;
        }
        while (reduce <= this.tableElement!.clientHeight) {
          let newTableElement = this.createNewTreeTableElement(visibleObjects[skip]);
          this.tbodyElement?.append(newTableElement);
          if (this.treeElement?.lastChild) {
            (this.treeElement?.lastChild as HTMLElement).style.height = visibleObjects[skip].height + 'px';
          }
          this.currentRecycleList.push(newTableElement);
          reduce += newTableElement.clientHeight;
        }
        for (let i = 0; i < this.currentRecycleList.length; i++) {
          this.freshCurrentLine(
            this.currentRecycleList[i],
            visibleObjects[i + skip],
            this.treeElement?.children[i] as HTMLElement
          );
        }
      });
    return visibleObjects;
  }

  createNewTreeTableElement(rowData: TableRowObject): any {
    let newTableElement = document.createElement('div');
    newTableElement.classList.add('tr');
    let treeTop = 0;
    if (this.treeElement!.children?.length > 0) {
      let transX = Number((this.treeElement?.lastChild as HTMLElement).style.transform.replace(/[^0-9]/gi, ''));
      treeTop += transX + rowData.height;
    }
    this?.columns?.forEach((column: any, index) => {
      let dataIndex = column.getAttribute('data-index') || '1';
      let td: any;
      let text = this.formatName(dataIndex, rowData.data[dataIndex]);
      if (index === 0) {
        if (column.template) {
          td = column.template.render(rowData.data).content.cloneNode(true);
          td.template = column.template;
          td.title = text;
        } else {
          td = document.createElement('div');
          td.innerHTML = text;
          td.dataIndex = dataIndex;
          td.title = text;
        }
        if (rowData.data.children && rowData.data.children.length > 0 && !rowData.data.hasNext) {
          let btn = this.createExpandBtn(rowData);
          td.insertBefore(btn, td.firstChild);
        }
        if (rowData.data.hasNext) {
          td.title = rowData.data.objectName;
          let btn = this.createBtn(rowData);
          td.insertBefore(btn, td.firstChild);
        }
        td.style.paddingLeft = rowData.depth * 15 + 'px';
        if (!rowData.data.children || rowData.data.children.length === 0) {
          td.style.paddingLeft = 15 * rowData.depth + 16 + 'px';
        }
        (td as any).data = rowData.data;
        td.classList.add('tree-first-body');
        td.style.position = 'absolute';
        td.style.top = '0px';
        td.style.left = '0px';
        td.onmouseenter = () => {
          let indexOf = this.currentTreeDivList.indexOf(td);
          this.currentRecycleList.forEach((row) => {
            row.classList.remove('mouse-in');
          });
          if (indexOf >= 0 && indexOf < this.currentRecycleList.length && td.innerHTML != '') {
            this.setMouseIn(true, [newTableElement]);
          }
        };
        td.onmouseleave = () => {
          let indexOf = this.currentTreeDivList.indexOf(td);
          if (indexOf >= 0 && indexOf < this.currentRecycleList.length) {
            this.setMouseIn(false, [newTableElement]);
          }
        };
        td.onclick = () => {
          let indexOf = this.currentTreeDivList.indexOf(td);
          this.dispatchRowClickEvent(rowData, [td, newTableElement]);
        };
        this.setHighLight(rowData.data.isSearch, td);
        this.treeElement!.style.width = column.getAttribute('width');
        this.treeElement?.append(td);
        this.currentTreeDivList.push(td);
      } else {
        td = document.createElement('div');
        td.classList.add('td');
        td.style.overflow = 'hidden';
        td.style.textOverflow = 'ellipsis';
        td.style.whiteSpace = 'nowrap';
        td.title = text;
        td.dataIndex = dataIndex;
        td.style.justifyContent = column.getAttribute('align') || 'flex-start';
        if (column.template) {
          td.appendChild(column.template.render(rowData.data).content.cloneNode(true));
          td.template = column.template;
        } else {
          td.innerHTML = text;
        }
        newTableElement.append(td);
      }
    });
    let lastChild = this.treeElement?.lastChild as HTMLElement;
    if (lastChild) {
      lastChild.style.transform = `translateY(${treeTop}px)`;
    }
    (newTableElement as any).data = rowData.data;
    newTableElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
    newTableElement.style.position = 'absolute';
    newTableElement.style.top = '0px';
    newTableElement.style.left = '0px';
    newTableElement.style.cursor = 'pointer';
    this.setHighLight(rowData.data.isSearch, newTableElement);
    newTableElement.onmouseenter = () => {
      if ((newTableElement as any).data.isSelected) return;
      let indexOf = this.currentRecycleList.indexOf(newTableElement);
      this.currentTreeDivList.forEach((row) => {
        row.classList.remove('mouse-in');
      });
      if (indexOf >= 0 && indexOf < this.treeElement!.children.length) {
        this.setMouseIn(true, [this.treeElement?.children[indexOf] as HTMLElement]);
      }
    };
    newTableElement.onmouseleave = () => {
      if ((newTableElement as any).data.isSelected) return;
      let indexOf = this.currentRecycleList.indexOf(newTableElement);
      if (indexOf >= 0 && indexOf < this.treeElement!.children.length) {
        this.setMouseIn(false, [this.treeElement?.children[indexOf] as HTMLElement]);
      }
    };
    newTableElement.onclick = (e) => {
      let indexOf = this.currentRecycleList.indexOf(newTableElement);
      this.dispatchRowClickEvent(rowData, [this.treeElement?.children[indexOf] as HTMLElement, newTableElement]);
    };
    return newTableElement;
  }

  createBtn(rowData: any) {
    let btn: any = document.createElement('lit-icon');
    btn.classList.add('tree-icon');
    if (rowData.data.expanded) {
      btn.name = 'plus-square';
    } else {
      btn.name = 'minus-square';
    }
    btn.addEventListener('click', (e: any) => {
      rowData.data.status = false;
      const resetNodeHidden = (hidden: boolean, rowData: any) => {
        if (hidden) {
          rowData.children.forEach((child: any) => {
            child.rowHidden = false;
          });
        } else {
          rowData.children.forEach((child: any) => {
            child.rowHidden = true;
            resetNodeHidden(hidden, child);
          });
        }
      };

      if (rowData.data.expanded) {
        rowData.data.status = true;
        this.dispatchRowClickEventIcon(rowData, [btn]);
        rowData.data.expanded = false;
        resetNodeHidden(true, rowData);
      } else {
        rowData.data.expanded = true;
        rowData.data.status = false;
        resetNodeHidden(false, rowData);
      }
      this.reMeauseHeight();
    });
    return btn;
  }

  createExpandBtn(rowData: any) {
    let btn: any = document.createElement('lit-icon');
    btn.classList.add('tree-icon');
    // @ts-ignore
    if (rowData.expanded) {
      btn.name = 'minus-square';
    } else {
      btn.name = 'plus-square';
    }
    btn.onclick = (e: Event) => {
      const resetNodeHidden = (hidden: boolean, rowData: any) => {
        if (rowData.children.length > 0) {
          if (hidden) {
            rowData.children.forEach((child: any) => {
              child.rowHidden = true;
              resetNodeHidden(hidden, child);
            });
          } else {
            rowData.children.forEach((child: any) => {
              child.rowHidden = !rowData.expanded;
              if (rowData.expanded) {
                resetNodeHidden(hidden, child);
              }
            });
          }
        }
      };

      if (rowData.expanded) {
        rowData.expanded = false;
        resetNodeHidden(true, rowData);
      } else {
        rowData.expanded = true;
        resetNodeHidden(false, rowData);
      }
      this.reMeauseHeight();
      e.stopPropagation();
    };
    return btn;
  }

  reMeauseHeight() {
    if (this.currentRecycleList.length == 0) {
      return;
    }
    let totalHeight = 0;
    this.recycleDs.forEach((it) => {
      if (!it.rowHidden) {
        it.top = totalHeight;
        totalHeight += it.height;
      }
    });
    this.tbodyElement && (this.tbodyElement.style.height = totalHeight + (this.isScrollXOutSide ? 0 : 0) + 'px');
    this.treeElement!.style.height = this.tableElement!.clientHeight - this.theadElement!.clientHeight + 'px';
    let visibleObjects = this.recycleDs.filter((item) => {
      return !item.rowHidden;
    });
    let top = this.tableElement!.scrollTop;
    let skip = 0;
    for (let i = 0; i < visibleObjects.length; i++) {
      if (visibleObjects[i].top <= top && visibleObjects[i].top + visibleObjects[i].height >= top) {
        skip = i;
        break;
      }
    }
    let reduce = this.currentRecycleList.map((item) => item.clientHeight).reduce((a, b) => a + b, 0);
    if (reduce == 0) {
      return;
    }
    while (reduce <= this.tableElement!.clientHeight) {
      let newTableElement;
      if (this.hasAttribute('tree')) {
        newTableElement = this.createNewTreeTableElement(visibleObjects[skip]);
      } else {
        newTableElement = this.createNewTableElement(visibleObjects[skip]);
      }
      this.tbodyElement?.append(newTableElement);
      if (this.hasAttribute('tree')) {
        if (this.treeElement?.lastChild) {
          (this.treeElement?.lastChild as HTMLElement).style.height = visibleObjects[skip].height + 'px';
        }
      }
      this.currentRecycleList.push(newTableElement);
      reduce += newTableElement.clientHeight;
    }
    for (let i = 0; i < this.currentRecycleList.length; i++) {
      if (this.hasAttribute('tree')) {
        this.freshCurrentLine(
          this.currentRecycleList[i],
          visibleObjects[i + skip],
          this.treeElement?.children[i] as HTMLElement
        );
      } else {
        this.freshCurrentLine(this.currentRecycleList[i], visibleObjects[i + skip]);
      }
    }
  }

  createNewTableElement(rowData: any): any {
    let newTableElement = document.createElement('div');
    newTableElement.classList.add('tr');
    this?.columns?.forEach((column: any) => {
      let dataIndex = column.getAttribute('data-index') || '1';
      let td: any;
      td = document.createElement('div');
      td.classList.add('td');
      td.style.overflow = 'hidden';
      td.style.textOverflow = 'ellipsis';
      td.style.whiteSpace = 'nowrap';
      td.dataIndex = dataIndex;
      td.style.justifyContent = column.getAttribute('align') || 'flex-start';
      let text = this.formatName(dataIndex, rowData.data[dataIndex]);
      td.title = text;
      if (column.template) {
        td.appendChild(column.template.render(rowData.data).content.cloneNode(true));
        td.template = column.template;
      } else {
        td.innerHTML = text;
      }
      newTableElement.append(td);
    });
    newTableElement.onclick = () => {
      this.dispatchRowClickEvent(rowData, [newTableElement]);
    };
    newTableElement.onmouseenter = () => {
      this.dispatchRowHoverEvent(rowData, [newTableElement]);
    };
    if (rowData.data.isSelected != undefined) {
      this.setSelectedRow(rowData.data.isSelected, [newTableElement]);
    }
    (newTableElement as any).data = rowData.data;
    newTableElement.style.cursor = 'pointer';
    newTableElement.style.gridTemplateColumns = this.gridTemplateColumns.join(' ');
    newTableElement.style.position = 'absolute';
    newTableElement.style.top = '0px';
    newTableElement.style.left = '0px';
    if (this.getItemTextColor) {
      newTableElement.style.color = this.getItemTextColor(rowData.data);
    }
    return newTableElement;
  }

  freshCurrentLine(element: HTMLElement, rowObject: TableRowObject, firstElement?: HTMLElement) {
    if (!rowObject) {
      if (firstElement) {
        firstElement.style.display = 'none';
      }
      element.style.display = 'none';
      return;
    }
    let childIndex = -1;
    this.setHighLight(rowObject.data.isSearch, element);
    element.childNodes.forEach((child) => {
      if (child.nodeType != 1) return;
      childIndex++;
      let idx = firstElement != undefined ? childIndex + 1 : childIndex;
      if (firstElement != undefined && childIndex == 0) {
        this.setHighLight(rowObject.data.isSearch, firstElement);
        (firstElement as any).data = rowObject.data;
        if ((this.columns![0] as any).template) {
          firstElement.innerHTML = (this.columns![0] as any).template
            .render(rowObject.data)
            .content.cloneNode(true).innerHTML;
        } else {
          let dataIndex = this.columns![0].getAttribute('data-index') || '1';
          let text = this.formatName(dataIndex, rowObject.data[dataIndex]);
          firstElement.innerHTML = text;
          firstElement.title = text;
        }
        if (rowObject.children && rowObject.children.length > 0 && !rowObject.data.hasNext) {
          let btn = this.createExpandBtn(rowObject);
          firstElement.insertBefore(btn, firstElement.firstChild);
        }
        firstElement.style.paddingLeft = 15 * rowObject.depth + 'px';
        if (!rowObject.children || rowObject.children.length === 0) {
          firstElement.style.paddingLeft = 15 * rowObject.depth + 16 + 'px';
        }
        if (rowObject.data.hasNext) {
          let btn = this.createBtn(rowObject);
          firstElement.title = rowObject.data.objectName;
          firstElement.insertBefore(btn, firstElement.firstChild);
          firstElement.style.paddingLeft = 15 * rowObject.depth + 'px';
        }
        firstElement.onclick = () => {
          this.dispatchRowClickEvent(rowObject, [firstElement, element]);
        };
        firstElement.style.transform = `translateY(${rowObject.top - this.tableElement!.scrollTop}px)`;
        if (rowObject.data.isSelected != undefined) {
          this.setSelectedRow(rowObject.data.isSelected, [firstElement]);
        } else {
          this.setSelectedRow(false, [firstElement]);
        }
      }
      let dataIndex = this.columns![idx].getAttribute('data-index') || '1';
      let text = this.formatName(dataIndex, rowObject.data[dataIndex]);
      if ((this.columns![idx] as any).template) {
        (child as HTMLElement).innerHTML = '';
        (child as HTMLElement).appendChild(
          (this.columns![idx] as any).template.render(rowObject.data).content.cloneNode(true)
        );
        (child as HTMLElement).title = text;
      } else {
        (child as HTMLElement).innerHTML = text;
        (child as HTMLElement).title = text;
      }
    });
    if (element.style.display == 'none') {
      element.style.display = 'grid';
    }
    element.style.transform = `translateY(${rowObject.top}px)`;
    if (firstElement && firstElement.style.display == 'none') {
      firstElement.style.display = 'flex';
    }
    element.onclick = (e) => {
      if (firstElement != undefined) {
        this.dispatchRowClickEvent(rowObject, [firstElement, element]);
      } else {
        this.dispatchRowClickEvent(rowObject, [element]);
      }
    };
    element.onmouseenter = () => {
      this.dispatchRowHoverEvent(rowObject, [element]);
    };
    (element as any).data = rowObject.data;
    if (rowObject.data.isSelected != undefined) {
      this.setSelectedRow(rowObject.data.isSelected, [element]);
    } else {
      this.setSelectedRow(false, [element]);
    }
    if (rowObject.data.isHover != undefined) {
      this.setMouseIn(rowObject.data.isHover, [element]);
    } else {
      this.setMouseIn(false, [element]);
    }
    if (this.getItemTextColor) {
      element.style.color = this.getItemTextColor((element as any).data);
    }
  }

  setSelectedRow(isSelected: boolean, rows: any[]) {
    if (isSelected) {
      rows.forEach((row) => {
        if (row.classList.contains('mouse-in')) row.classList.remove('mouse-in');
        row.classList.add('mouse-select');
      });
    } else {
      rows.forEach((row) => {
        row.classList.remove('mouse-select');
      });
    }
  }

  setMouseIn(isMouseIn: boolean, rows: any[]) {
    if (isMouseIn) {
      rows.forEach((row) => {
        row.classList.add('mouse-in');
      });
    } else {
      rows.forEach((row) => {
        row.classList.remove('mouse-in');
      });
    }
  }

  scrollToData(data: any) {
    if (this.recycleDs.length > 0) {
      let filter = this.recycleDs.filter((item) => {
        return item.data == data;
      });
      if (filter.length > 0) {
        this.tableElement!.scrollTop = filter[0].top;
      }
      this.setCurrentSelection(data);
    }
  }

  expandList(datasource: any[]) {
    let filter = this.recycleDs.filter((item) => {
      return datasource.indexOf(item.data) != -1;
    });
    if (filter.length > 0) {
      filter.forEach((item) => {
        item.expanded = true;
        item.rowHidden = false;
      });
    }
    this.reMeauseHeight();
  }

  clearAllSelection(rowObjectData: any) {
    this.recycleDs.forEach((item) => {
      if (item.data != rowObjectData && item.data.isSelected) {
        item.data.isSelected = false;
      }
    });
    this.setSelectedRow(false, this.currentTreeDivList);
    this.setSelectedRow(false, this.currentRecycleList);
  }

  clearAllHover(rowObjectData: any) {
    this.recycleDs.forEach((item) => {
      if (item.data != rowObjectData && item.data.isHover) {
        item.data.isHover = false;
      }
    });
    this.setMouseIn(false, this.currentTreeDivList);
    this.setMouseIn(false, this.currentRecycleList);
  }

  mouseOut() {
    this.recycleDs.forEach((item) => (item.data.isHover = false));
    this.setMouseIn(false, this.currentTreeDivList);
    this.setMouseIn(false, this.currentRecycleList);
    this.dispatchEvent(
      new CustomEvent('row-hover', {
        detail: {
          data: undefined,
        },
        composed: true,
      })
    );
  }

  setCurrentSelection(data: any) {
    if (data.isSelected != undefined) {
      this.currentTreeDivList.forEach((item) => {
        if ((item as any).data == data) {
          this.setSelectedRow(data.isSelected, [item]);
        }
      });
      this.currentRecycleList.forEach((item) => {
        if ((item as any).data == data) {
          this.setSelectedRow(data.isSelected, [item]);
        }
      });
    }
  }

  setCurrentHover(data: any) {
    this.setMouseIn(false, this.currentTreeDivList);
    this.setMouseIn(false, this.currentRecycleList);
    if (data.isHover != undefined) {
      this.currentTreeDivList.forEach((item) => {
        if ((item as any).data == data) {
          this.setMouseIn(data.isHover, [item]);
        }
      });
      this.currentRecycleList.forEach((item) => {
        if ((item as any).data == data) {
          this.setMouseIn(data.isHover, [item]);
        }
      });
    }
  }

  dispatchRowClickEventIcon(rowObject: any, elements: any[]) {
    this.dispatchEvent(
      new CustomEvent('icon-click', {
        detail: {
          ...rowObject.data,
          data: rowObject.data,
          callBack: (isSelected: boolean) => {
            //是否爲单选
            if (isSelected) {
              this.clearAllSelection(rowObject.data);
            }
            this.setSelectedRow(rowObject.data.isSelected, elements);
          },
        },
        composed: true,
      })
    );
  }

  dispatchRowClickEvent(rowObject: any, elements: any[]) {
    this.dispatchEvent(
      new CustomEvent('row-click', {
        detail: {
          ...rowObject.data,
          data: rowObject.data,
          callBack: (isSelected: boolean) => {
            //是否爲单选
            if (isSelected) {
              this.clearAllSelection(rowObject.data);
            }
            this.setSelectedRow(rowObject.data.isSelected, elements);
          },
        },
        composed: true,
      })
    );
  }

  dispatchRowHoverEvent(rowObject: any, elements: any[]) {
    this.dispatchEvent(
      new CustomEvent('row-hover', {
        detail: {
          data: rowObject.data,
          callBack: () => {
            this.clearAllHover(rowObject.data);
            this.setMouseIn(rowObject.data.isHover, elements);
          },
        },
        composed: true,
      })
    );
  }

  formatName(key: string, name: any) {
    let content = name;
    if (this.itemTextHandleMap.has(key)) {
      content = this.itemTextHandleMap.get(key)?.(name) || '';
    }
    if (content !== undefined && content !== null) {
      return content.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    return '';
  }

  setHighLight(isSearch: boolean, element: any) {
    if (isSearch) {
      element.setAttribute('high-light', '');
    } else {
      element.removeAttribute('high-light');
    }
  }
}

if (!customElements.get('lit-page-table')) {
  customElements.define('lit-page-table', LitPageTable);
}
