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

import {
  BaseStruct,
  drawFlagLine,
  drawLines,
  drawLoading,
  ns2x,
  Render,
  RequestMessage,
  drawSelection,
  isFrameContainPoint,
} from './ProcedureWorkerCommon.js';
import { TraceRow } from '../../component/trace/base/TraceRow.js';

export class EnergyPowerRender extends Render {
  renderMainThread(
    powerReq: { useCache: boolean; context: CanvasRenderingContext2D; type: string; appName: string },
    row: TraceRow<EnergyPowerStruct>
  ) {
    let list = row.dataList;
    let filter = row.dataListCache;
    power(
      list,
      filter,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      row.frame,
      powerReq.useCache || !TraceRow.range!.refresh,
      powerReq.appName
    );
    powerReq.context.beginPath();
    let find = false;
    for (let i = 0; i < filter.length; i++) {
      let re = filter[i];
      EnergyPowerStruct.draw(powerReq, i, re, row);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        EnergyPowerStruct.hoverEnergyPowerStruct = re;
        find = true;
      }
    }
    if (!find && row.isHover) EnergyPowerStruct.hoverEnergyPowerStruct = undefined;
    TraceRow.range!.refresh = true;
    if (EnergyPowerStruct.maxPower != 0) {
      let s = EnergyPowerStruct.maxPower + 'mAs';
      let textMetrics = powerReq.context.measureText(s);
      powerReq.context.globalAlpha = 1.0;
      powerReq.context.fillStyle = '#f0f0f0';
      powerReq.context.fillRect(0, 5, textMetrics.width + 8, 18);
      powerReq.context.globalAlpha = 1;
      powerReq.context.fillStyle = '#333';
      powerReq.context.textBaseline = 'middle';
      powerReq.context.fillText(s, 4, 5 + 9);
    }
    powerReq.context.closePath();
    let spApplication = document.getElementsByTagName('sp-application')[0];
    let isDark = spApplication.hasAttribute('dark');
    drawLegend(powerReq, isDark);
  }

  render(energyPowerRequest: RequestMessage, list: Array<any>, filter: Array<any>) {
    if (energyPowerRequest.lazyRefresh) {
      power(
        list,
        filter,
        energyPowerRequest.startNS,
        energyPowerRequest.endNS,
        energyPowerRequest.totalNS,
        energyPowerRequest.frame,
        energyPowerRequest.useCache || !energyPowerRequest.range.refresh,
        energyPowerRequest.params.maxPowerName
      );
    } else {
      if (!energyPowerRequest.useCache) {
        power(
          list,
          filter,
          energyPowerRequest.startNS,
          energyPowerRequest.endNS,
          energyPowerRequest.totalNS,
          energyPowerRequest.frame,
          false,
          energyPowerRequest.params.maxPowerName
        );
      }
    }
    if (energyPowerRequest.canvas) {
      energyPowerRequest.context.clearRect(0, 0, energyPowerRequest.canvas.width, EnergyPowerStruct.rowHeight);
      let arr = filter;
      if (
        arr.length > 0 &&
        !energyPowerRequest.range.refresh &&
        !energyPowerRequest.useCache &&
        energyPowerRequest.lazyRefresh
      ) {
        drawLoading(
          energyPowerRequest.context,
          energyPowerRequest.startNS,
          energyPowerRequest.endNS,
          energyPowerRequest.totalNS,
          energyPowerRequest.frame,
          arr[0].startNS,
          arr[arr.length - 1].startNS + arr[arr.length - 1].dur
        );
      }
      drawLines(
        energyPowerRequest.context,
        energyPowerRequest.xs,
        energyPowerRequest.frame.height,
        energyPowerRequest.lineColor
      );
      energyPowerRequest.context.beginPath();
      EnergyPowerStruct.hoverEnergyPowerStruct = undefined;
      if (energyPowerRequest.isHover) {
        for (let re of filter) {
          if (
            re.frame &&
            energyPowerRequest.hoverX >= re.frame.x &&
            energyPowerRequest.hoverX <= re.frame.x + re.frame.width &&
            energyPowerRequest.hoverY >= re.frame.y &&
            energyPowerRequest.hoverY <= re.frame.y + re.frame.height
          ) {
            EnergyPowerStruct.hoverEnergyPowerStruct = re;
            break;
          }
        }
      }
      EnergyPowerStruct.selectEnergyPowerStruct = energyPowerRequest.params.selectEnergyPowerStruct;
      for (let index = 0; index < filter.length; index++) {}
      energyPowerRequest.context.stroke();
      drawSelection(energyPowerRequest.context, energyPowerRequest.params);
      energyPowerRequest.context.closePath();
      if (EnergyPowerStruct.maxPower != 0) {
        let s = EnergyPowerStruct.maxPower + 'mAs';
        let textMetrics = energyPowerRequest.context.measureText(s);
        energyPowerRequest.context.globalAlpha = 1.0;
        energyPowerRequest.context.fillStyle = '#f0f0f0';
        energyPowerRequest.context.fillRect(0, 5, textMetrics.width + 8, 18);
        energyPowerRequest.context.globalAlpha = 1;
        energyPowerRequest.context.fillStyle = '#333';
        energyPowerRequest.context.textBaseline = 'middle';
        energyPowerRequest.context.fillText(s, 4, 5 + 9);
      }
      drawLegend(energyPowerRequest);
      drawFlagLine(
        energyPowerRequest.context,
        energyPowerRequest.flagMoveInfo,
        energyPowerRequest.flagSelectedInfo,
        energyPowerRequest.startNS,
        energyPowerRequest.endNS,
        energyPowerRequest.totalNS,
        energyPowerRequest.frame,
        energyPowerRequest.slicesTime
      );
    }
    // @ts-ignore
    self.postMessage({
      id: energyPowerRequest.id,
      type: energyPowerRequest.type,
      results: energyPowerRequest.canvas ? undefined : filter,
      hover: EnergyPowerStruct.hoverEnergyPowerStruct,
    });
  }
}

export function drawLegend(req: any, isDark?: boolean) {
  let textList = ['CPU', 'LOCATION', 'GPU', 'DISPLAY', 'CAMERA', 'BLUETOOTH', 'FLASHLIGHT', 'AUDIO', 'WIFISCAN'];
  for (let index = 0; index < textList.length; index++) {
    let text = req.context.measureText(textList[index]);
    req.context.fillStyle = EnergyPowerStruct.getHistogramColor(textList[index]);
    req.context.globalAlpha = 1;
    let canvasEndX = req.context.canvas.clientWidth - EnergyPowerStruct.OFFSET_WIDTH;
    let textColor = isDark ? '#FFFFFF' : '#333';
    if (index == 0) {
      req!.context.fillRect(canvasEndX - EnergyPowerStruct.powerItemNumber * 80, 12, 8, 8);
      req.context.globalAlpha = 1;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req.context.fillText(textList[index], canvasEndX - EnergyPowerStruct.powerItemNumber * 80 + 10, 18);
      EnergyPowerStruct.currentTextWidth = canvasEndX - EnergyPowerStruct.powerItemNumber * 80 + 40 + text.width;
    } else {
      req!.context.fillRect(EnergyPowerStruct.currentTextWidth, 12, 8, 8);
      req.context.globalAlpha = 1;
      req.context.fillStyle = textColor;
      req.context.textBaseline = 'middle';
      req!.context.fillText(textList[index], EnergyPowerStruct.currentTextWidth + 12, 18);
      EnergyPowerStruct.currentTextWidth = EnergyPowerStruct.currentTextWidth + 40 + text.width;
    }
  }
  req.context.fillStyle = '#333';
}

export function power(
  list: Array<any>,
  res: Array<any>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: any,
  use: boolean,
  appName: string
) {
  if (use && res.length > 0) {
    for (let i = 0; i < res.length; i++) {
      let item = res[i];
      let obj = item[appName];
      if (obj != undefined) {
        if (obj.ts + 1000000000 > (startNS || 0) && (obj.ts || 0) < (endNS || 0)) {
          EnergyPowerStruct.setPowerFrame(item, 5, startNS || 0, endNS || 0, totalNS || 0, frame);
        } else {
          obj.frame = null;
        }
      }
    }
    return;
  }
  res.length = 0;
  if (list) {
    let firstList: Array<any> = [];
    EnergyPowerStruct.maxPower = 0;
    for (let index = 0; index < list.length; index++) {
      let item = list[index];
      let obj = item[appName];
      if (obj != undefined) {
        if (obj.ts + 1000000000 > (startNS || 0) && (obj.ts || 0) < (endNS || 0)) {
          firstList.push(obj);
        }
      }
    }

    let array = firstList.sort((a, b) => a.ts - b.ts);
    for (let index = 0; index < array.length; index++) {
      if (res.length == 0) {
        res.push(array[index]);
      } else {
        let rightTime = array[index].ts + 500000000;
        let leftTime = array[index].ts - 500000000;
        let obj = res[res.length - 1];
        if (obj.ts >= leftTime && obj.ts <= rightTime) {
          obj.cpu = obj.cpu == 0 ? array[index].cpu : obj.cpu;
          obj.location = obj.location == 0 ? array[index].location : obj.location;
          obj.gpu = obj.gpu == 0 ? array[index].gpu : obj.gpu;
          obj.display = obj.display == 0 ? array[index].display : obj.display;
          obj.camera = obj.camera == 0 ? array[index].camera : obj.camera;
          obj.bluetooth = obj.bluetooth == 0 ? array[index].bluetooth : obj.bluetooth;
          obj.flashlight = obj.flashlight == 0 ? array[index].flashlight : obj.flashlight;
          obj.audio = obj.audio ? array[index].audio : obj.audio;
          obj.wifiscan = obj.wifiscan == 0 ? array[index].wifiscan : obj.wifiscan;
        } else {
          res.push(array[index]);
        }
      }
    }
    res.forEach((item) => {
      EnergyPowerStruct.setPowerFrame(item, 5, startNS || 0, endNS || 0, totalNS || 0, frame);
      let max =
        (item.cpu || 0) +
        (item.location || 0) +
        (item.gpu || 0) +
        (item.display || 0) +
        (item.camera || 0) +
        (item.bluetooth || 0) +
        (item.flashlight || 0) +
        (item.audio || 0) +
        (item.wifiscan || 0);
      if (max > EnergyPowerStruct.maxPower) {
        EnergyPowerStruct.maxPower = max;
      }
    });
  }
}

export class EnergyPowerStruct extends BaseStruct {
  static maxPower: number = 0;
  static maxPowerName: string = '0';
  static powerItemNumber: number = 9;
  static currentTextWidth: number = 0;
  static rowHeight: number = 200;
  static appName: string | undefined;
  static hoverEnergyPowerStruct: EnergyPowerStruct | undefined;
  static selectEnergyPowerStruct: EnergyPowerStruct | undefined;
  static OFFSET_WIDTH: number = 266;
  name: string | undefined;
  ts: number = 0;
  cpu: number = 0;
  location: number = 0;
  gpu: number = 0;
  display: number = 0;
  camera: number = 0;
  bluetooth: number = 0;
  flashlight: number = 0;
  audio: number = 0;
  wifiscan: number = 0;

  static draw(req: any, index: number, data: EnergyPowerStruct, row: TraceRow<EnergyPowerStruct>) {
    if (data.frame) {
      let width = data.frame.width || 0;
      req!.context.globalAlpha = 1.0;
      req!.context.lineWidth = 1;
      this.currentTextWidth = 0;
      let cpuHeight = this.drawHistogram(req, data, -1, data.cpu!, 'CPU', row.frame);
      let locationHeight = this.drawHistogram(req, data, cpuHeight, data.location!, 'LOCATION', row.frame);
      let gpuHeight = this.drawHistogram(req, data, cpuHeight - locationHeight, data.gpu!, 'GPU', row.frame);
      let displayHeight = this.drawHistogram(
        req,
        data,
        cpuHeight - locationHeight - gpuHeight,
        data.display!,
        'DISPLAY',
        row.frame
      );
      let cameraHeight = this.drawHistogram(
        req,
        data,
        cpuHeight - locationHeight - gpuHeight - displayHeight,
        data.camera!,
        'CAMERA',
        row.frame
      );
      let bluetoothHeight = this.drawHistogram(
        req,
        data,
        cpuHeight - locationHeight - gpuHeight - displayHeight - cameraHeight,
        data.bluetooth!,
        'BLUETOOTH',
        row.frame
      );
      let flashlightHeight = this.drawHistogram(
        req,
        data,
        cpuHeight - locationHeight - gpuHeight - displayHeight - cameraHeight - bluetoothHeight,
        data.flashlight!,
        'FLASHLIGHT',
        row.frame
      );
      let audioHeight = this.drawHistogram(
        req,
        data,
        cpuHeight - locationHeight - gpuHeight - displayHeight - cameraHeight - bluetoothHeight - flashlightHeight,
        data.audio!,
        'AUDIO',
        row.frame
      );
      let wifiHeight = this.drawHistogram(
        req,
        data,
        cpuHeight -
          locationHeight -
          gpuHeight -
          displayHeight -
          cameraHeight -
          bluetoothHeight -
          flashlightHeight -
          audioHeight,
        data.wifiscan!,
        'WIFISCAN',
        row.frame
      );
      let maxPointY = this.drawPolyline(req, index, data, row.frame, wifiHeight);
      if (data.ts === EnergyPowerStruct.hoverEnergyPowerStruct?.ts) {
        let endPointX = ns2x(
          (data.ts || 0) + 500000000,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS,
          row.frame
        );
        let startPointX = ns2x(
          (data.ts || 0) - 500000000,
          TraceRow.range!.startNS,
          TraceRow.range!.endNS,
          TraceRow.range!.totalNS,
          row.frame
        );
        let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
        req.context.globalAlpha = 1;
        req!.context.lineWidth = 2;
        req.context.fillStyle = '#333';
        req!.context.strokeRect(startPointX, maxPointY, frameWidth, req.context.canvas.width - maxPointY);
      }
    }
    req!.context.globalAlpha = 1.0;
    req!.context.lineWidth = 1;
  }

  static drawHistogram(
    req: RequestMessage,
    data: EnergyPowerStruct,
    height: number,
    itemValue: number,
    textItem: string,
    rowFrame: any
  ): number {
    let endPointX = ns2x(
      (data.ts || 0) + 500000000,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      rowFrame
    );
    let startPointX = ns2x(
      (data.ts || 0) - 500000000,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      rowFrame
    );
    let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
    let histogramColor = this.getHistogramColor(textItem);
    req!.context.fillStyle = histogramColor;
    req!.context.strokeStyle = histogramColor;
    let dataHeight: number = Math.floor(((itemValue || 0) * (this.rowHeight - 40)) / EnergyPowerStruct.maxPower);
    if (itemValue != 0 && dataHeight < 15) {
      dataHeight = 15;
    }
    let drawStartY = 0;

    if (height == -1) {
      drawStartY = data.frame!.y + this.rowHeight - dataHeight + 4;
      req!.context.fillRect(startPointX, drawStartY, frameWidth, dataHeight);
      return drawStartY;
    } else {
      drawStartY = height - dataHeight;
      req!.context.fillRect(startPointX, drawStartY, frameWidth, dataHeight);
      if (textItem == 'WIFISCAN') {
        return drawStartY;
      }
      return dataHeight;
    }
  }

  static drawPolyline(req: RequestMessage, index: number, data: EnergyPowerStruct, rowFrame: any, totalHeight: number) {
    let pointX = ns2x(data.ts || 0, TraceRow.range!.startNS, TraceRow.range!.endNS, TraceRow.range!.totalNS, rowFrame);
    let maxHeight =
      (data.cpu || 0) +
      (data.location || 0) +
      (data.gpu || 0) +
      (data.display || 0) +
      (data.camera || 0) +
      (data.bluetooth || 0) +
      (data.flashlight || 0) +
      (data.audio || 0) +
      (data.wifiscan || 0);
    let drawHeight: number = Math.floor(((maxHeight || 0) * (this.rowHeight - 40)) / EnergyPowerStruct.maxPower);
    let drawY = data.frame!.y + this.rowHeight - drawHeight + 5;
    req!.context.fillStyle = '#ED6F21';
    req!.context.strokeStyle = '#ED6F21';

    if (index == 0) {
      req.context.beginPath();
      req.context.arc(pointX, totalHeight, 4, 0, 2 * Math.PI);
      req.context.fill();
      req.context.moveTo(pointX, totalHeight);
    } else {
      req.context.lineTo(pointX, totalHeight);
      req.context.stroke();
      req.context.beginPath();
      req.context.arc(pointX, totalHeight, 4, 0, 2 * Math.PI);
      req.context.fill();
    }
    return totalHeight;
  }

  static setPowerFrame(powerNode: any, padding: number, startNS: number, endNS: number, totalNS: number, frame: any) {
    let startPointX: number;
    let endPointX: number;
    if ((powerNode.ts || 0) < startNS) {
      startPointX = 0;
    } else {
      startPointX = ns2x((powerNode.ts || 0) - 500000000, startNS, endNS, totalNS, frame);
    }
    if (powerNode.ts + 500000000 > endNS) {
      endPointX = frame.width;
    } else {
      endPointX = ns2x(powerNode.ts + 500000000, startNS, endNS, totalNS, frame);
    }
    let frameWidth = endPointX - startPointX <= 1 ? 1 : endPointX - startPointX;
    if (!powerNode.frame) {
      powerNode.frame = {};
    }
    powerNode.frame.x = Math.floor(startPointX);
    powerNode.frame.y = frame.y + padding;
    powerNode.frame.width = Math.ceil(frameWidth);
    powerNode.frame.height = Math.floor(frame.height - padding * 2);
  }

  static getHistogramColor(textItem: string): string {
    switch (textItem) {
      case 'CPU':
        return '#92D6CC';
      case 'LOCATION':
        return '#61CFBE';
      case 'GPU':
        return '#86C5E3';
      case 'DISPLAY':
        return '#46B1E3';
      case 'CAMERA':
        return '#C386F0';
      case 'BLUETOOTH':
        return '#8981F7';
      case 'AUDIO':
        return '#AC49F5';
      case 'WIFISCAN':
        return '#92C4BD';
      default:
        return '#564AF7';
    }
  }
}
