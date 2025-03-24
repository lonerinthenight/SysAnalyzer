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

import { ColorUtils } from '../../component/trace/base/ColorUtils.js';
import {
  BaseStruct,
  drawFlagLine,
  drawLines,
  drawLoading,
  drawSelection,
  isFrameContainPoint,
  PerfRender,
  RequestMessage,
} from './ProcedureWorkerCommon.js';
import { TraceRow } from '../../component/trace/base/TraceRow.js';

export class EnergyAnomalyRender extends PerfRender {
  renderMainThread(
    req: {
      useCache: boolean;
      context: CanvasRenderingContext2D;
      type: string;
      appName: string;
      canvasWidth: number;
    },
    row: TraceRow<EnergyAnomalyStruct>
  ) {
    let list = row.dataList;
    let filter = row.dataListCache;
    anomaly(
      list,
      filter,
      TraceRow.range!.startNS,
      TraceRow.range!.endNS,
      TraceRow.range!.totalNS,
      row.frame,
      req.appName,
      req.useCache || !TraceRow.range!.refresh
    );
    req.context.beginPath();
    let find = false;
    let spApplication = document.getElementsByTagName('sp-application')[0];
    let isDark = spApplication.hasAttribute('dark');
    drawLegend(req, isDark);
    for (let re of filter) {
      EnergyAnomalyStruct.draw(req.context, re);
      if (row.isHover && re.frame && isFrameContainPoint(re.frame, row.hoverX, row.hoverY)) {
        EnergyAnomalyStruct.hoverEnergyAnomalyStruct = re;
        find = true;
      }
    }
    if (!find && row.isHover) EnergyAnomalyStruct.hoverEnergyAnomalyStruct = undefined;
    req.context.fillStyle = ColorUtils.FUNC_COLOR[0];
    req.context.strokeStyle = ColorUtils.FUNC_COLOR[0];
    req.context.closePath();
  }

  render(energyAnomalyRequest: RequestMessage, list: Array<any>, filter: Array<any>, dataList2: Array<any>) {
    if (energyAnomalyRequest.lazyRefresh) {
      anomaly(
        list,
        filter,
        energyAnomalyRequest.startNS,
        energyAnomalyRequest.endNS,
        energyAnomalyRequest.totalNS,
        energyAnomalyRequest.frame,
        energyAnomalyRequest.params.appName,
        energyAnomalyRequest.useCache || !energyAnomalyRequest.range.refresh
      );
    } else {
      if (!energyAnomalyRequest.useCache) {
        anomaly(
          list,
          filter,
          energyAnomalyRequest.startNS,
          energyAnomalyRequest.endNS,
          energyAnomalyRequest.totalNS,
          energyAnomalyRequest.frame,
          energyAnomalyRequest.params.appName,
          false
        );
      }
    }
    if (energyAnomalyRequest.canvas) {
      energyAnomalyRequest.context.clearRect(
        0,
        0,
        energyAnomalyRequest.canvas.width,
        energyAnomalyRequest.canvas.height
      );
      let energyAnomlyArr = filter;
      if (
        energyAnomlyArr.length > 0 &&
        !energyAnomalyRequest.range.refresh &&
        !energyAnomalyRequest.useCache &&
        energyAnomalyRequest.lazyRefresh
      ) {
        drawLoading(
          energyAnomalyRequest.context,
          energyAnomalyRequest.startNS,
          energyAnomalyRequest.endNS,
          energyAnomalyRequest.totalNS,
          energyAnomalyRequest.frame,
          energyAnomlyArr[0].startNS,
          energyAnomlyArr[energyAnomlyArr.length - 1].startNS
        );
      }
      drawLines(
        energyAnomalyRequest.context,
        energyAnomalyRequest.xs,
        energyAnomalyRequest.frame.height,
        energyAnomalyRequest.lineColor
      );
      energyAnomalyRequest.context.stroke();
      energyAnomalyRequest.context.beginPath();
      EnergyAnomalyStruct.hoverEnergyAnomalyStruct = undefined;
      if (energyAnomalyRequest.isHover) {
        let offset = 3;
        for (let re of filter) {
          if (
            re.frame &&
            energyAnomalyRequest.hoverX >= re.frame.x - offset &&
            energyAnomalyRequest.hoverX <= re.frame.x + re.frame.width + offset
          ) {
            EnergyAnomalyStruct.hoverEnergyAnomalyStruct = re;
            break;
          }
        }
      } else {
        EnergyAnomalyStruct.hoverEnergyAnomalyStruct = energyAnomalyRequest.params.hoverStruct;
      }
      EnergyAnomalyStruct.selectEnergyAnomalyStruct = energyAnomalyRequest.params.selectEnergyAnomalyStruct;
      energyAnomalyRequest.context.fillStyle = ColorUtils.FUNC_COLOR[0];
      energyAnomalyRequest.context.strokeStyle = ColorUtils.FUNC_COLOR[0];
      for (let re of filter) {
        EnergyAnomalyStruct.draw(energyAnomalyRequest.context, re);
      }
      drawLegend(energyAnomalyRequest);
      drawSelection(energyAnomalyRequest.context, energyAnomalyRequest.params);
      energyAnomalyRequest.context.closePath();
      drawFlagLine(
        energyAnomalyRequest.context,
        energyAnomalyRequest.flagMoveInfo,
        energyAnomalyRequest.flagSelectedInfo,
        energyAnomalyRequest.startNS,
        energyAnomalyRequest.endNS,
        energyAnomalyRequest.totalNS,
        energyAnomalyRequest.frame,
        energyAnomalyRequest.slicesTime
      );
    }
    // @ts-ignore
    self.postMessage({
      id: energyAnomalyRequest.id,
      type: energyAnomalyRequest.type,
      results: energyAnomalyRequest.canvas ? undefined : filter,
      hover: EnergyAnomalyStruct.hoverEnergyAnomalyStruct,
    });
  }
}

export function drawLegend(req: any, isDark?: boolean) {
  req.context.font = '12px Arial';
  let text = req.context.measureText('System Abnormality');
  req.context.fillStyle = '#E64566';
  req.context.strokeStyle = '#E64566';
  let textColor = isDark ? '#FFFFFF' : '#333';
  let canvasEndX = req.context.canvas.clientWidth - EnergyAnomalyStruct.OFFSET_WIDTH;
  let rectPadding: number;
  let textPadding: number;
  let textMargin: number;
  let currentTextWidth: number;
  let lastTextMargin: number;
  rectPadding = 280;
  textPadding = 270;
  textMargin = 250;
  currentTextWidth = canvasEndX - textMargin + text.width;
  lastTextMargin = currentTextWidth + 12;
  req!.context.fillRect(canvasEndX - rectPadding, 12, 8, 8);
  req.context.globalAlpha = 1;
  req.context.fillStyle = textColor;
  req.context.textBaseline = 'middle';
  req.context.fillText('System Abnormality', canvasEndX - textPadding, 18);
  req.context.fillStyle = '#FFC880';
  req.context.strokeStyle = '#FFC880';
  req.context.fillRect(currentTextWidth, 12, 8, 8);
  req.context.globalAlpha = 1;
  req.context.fillStyle = textColor;
  req.context.textBaseline = 'middle';
  req.context.fillText('Application Abnormality', lastTextMargin, 18);
  req.context.fillStyle = '#333';
}

export function anomaly(
  arr: Array<any>,
  res: Array<any>,
  startNS: number,
  endNS: number,
  totalNS: number,
  frame: any,
  appName: string | undefined,
  use: boolean
) {
  if (use && res.length > 0) {
    let pns = (endNS - startNS) / frame.width;
    let y = frame.y;
    for (let i = 0; i < res.length; i++) {
      let it = res[i];
      if ((it.startNS || 0) > startNS && (it.startNS || 0) < endNS) {
        if (!it.frame) {
          it.frame = {};
          it.frame.y = y;
        }
        it.frame.height = it.height;
        EnergyAnomalyStruct.setAnomalyFrame(it, pns, startNS, endNS, frame);
      } else {
        it.frame = null;
      }
    }
    return;
  }

  res.length = 0;
  if (arr) {
    let y = frame.y;
    let pns = (endNS - startNS) / frame.width;
    for (let index = 0; index < arr.length; index++) {
      let item = arr[index];
      if (!item.frame) {
        item.frame = {};
        item.frame.y = y;
      }
      item.frame.height = item.height;
      if (item.startNS + 50000 > (startNS || 0) && (item.startNS || 0) < (endNS || 0)) {
        EnergyAnomalyStruct.setAnomalyFrame(item, pns, startNS || 0, endNS || 0, frame);
        if (item.appKey === 'APPNAME' && item.Value.split(',').indexOf(appName) >= 0) {
          res.push(item);
        }
        if (item.appKey != 'APPNAME') {
          res.push(item);
        }
      }
    }
  }
}

export class EnergyAnomalyStruct extends BaseStruct {
  static hoverEnergyAnomalyStruct: EnergyAnomalyStruct | undefined;
  static selectEnergyAnomalyStruct: EnergyAnomalyStruct | undefined;
  static SYSTEM_EXCEPTION = new Set([
    'ANOMALY_SCREEN_OFF_ENERGY',
    'ANOMALY_ALARM_WAKEUP',
    'ANOMALY_KERNEL_WAKELOCK',
    'ANOMALY_CPU_HIGH_FREQUENCY',
    'ANOMALY_WAKEUP',
  ]);
  static OFFSET_WIDTH: number = 266;
  type: number | undefined;
  startNS: number | undefined;
  height: number | undefined;
  eventName: string | undefined;

  static draw(ctx: CanvasRenderingContext2D, data: EnergyAnomalyStruct) {
    if (data.frame) {
      EnergyAnomalyStruct.drawRoundRectPath(ctx, data.frame.x - 7, 20 - 7, 12, data);
    }
  }

  static drawRoundRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    data: EnergyAnomalyStruct
  ) {
    ctx.beginPath();
    ctx.arc(x + 7, y + 22, radius, 0, Math.PI * 2);
    ctx.closePath();
    let color = '';
    if (EnergyAnomalyStruct.SYSTEM_EXCEPTION.has(<string>data.eventName)) {
      color = '#E64566';
    } else {
      color = '#FFC880';
    }
    // 填充背景颜色
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
    // 填充文字颜色
    ctx.font = '12px Arial';
    ctx.fillStyle = ColorUtils.GREY_COLOR;
    ctx.textAlign = 'center';
    ctx.fillText('E', x + 7, y + 23);
  }

  static setAnomalyFrame(node: any, pns: number, startNS: number, endNS: number, frame: any) {
    if ((node.startNS || 0) < startNS) {
      node.frame.x = 0;
    } else {
      node.frame.x = Math.floor(((node.startNS || 0) - startNS) / pns);
    }
    if ((node.startNS || 0) > endNS) {
      node.frame.width = frame.width - node.frame.x;
    } else {
      node.frame.width = Math.ceil(((node.startNS || 0) - startNS) / pns - node.frame.x);
    }
    if (node.frame.width < 1) {
      node.frame.width = 1;
    }
  }
}
