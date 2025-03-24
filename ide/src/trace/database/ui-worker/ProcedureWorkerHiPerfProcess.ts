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
import { hiPerf, HiPerfStruct, PerfRender, RequestMessage } from './ProcedureWorkerCommon.js';
import { TraceRow } from '../../component/trace/base/TraceRow.js';

export class HiperfProcessRender extends PerfRender {
  renderMainThread(hiPerfProcessReq: any, row: TraceRow<HiPerfProcessStruct>): void {
    let list = row.dataList;
    let filter = row.dataListCache;
    let groupBy10MS = hiPerfProcessReq.scale > 30_000_000;
    if (list && row.dataList2.length === 0) {
      row.dataList2 = HiPerfProcessStruct.groupBy10MS(list, hiPerfProcessReq.intervalPerf);
    }
    hiPerf(
      list,
      row.dataList2,
      filter,
      TraceRow.range?.startNS ?? 0,
      TraceRow.range?.endNS ?? 0,
      row.frame,
      groupBy10MS,
      hiPerfProcessReq.useCache || (TraceRow.range?.refresh ?? false)
    );
    hiPerfProcessReq.context.beginPath();
    hiPerfProcessReq.context.fillStyle = ColorUtils.FUNC_COLOR[0];
    hiPerfProcessReq.context.strokeStyle = ColorUtils.FUNC_COLOR[0];
    let normalPath = new Path2D();
    let specPath = new Path2D();
    let offset = groupBy10MS ? 0 : 3;
    let find = false;
    for (let re of filter) {
      HiPerfProcessStruct.draw(hiPerfProcessReq.context, normalPath, specPath, re, groupBy10MS);
      if (row.isHover) {
        if (re.frame && row.hoverX >= re.frame.x - offset && row.hoverX <= re.frame.x + re.frame.width + offset) {
          HiPerfProcessStruct.hoverStruct = re;
          find = true;
        }
      }
    }
    if (!find && row.isHover) {
      HiPerfProcessStruct.hoverStruct = undefined;
    }
    if (groupBy10MS) {
      hiPerfProcessReq.context.fill(normalPath);
    } else {
      hiPerfProcessReq.context.stroke(normalPath);
      HiPerfStruct.drawSpecialPath(hiPerfProcessReq.context, specPath);
    }
    hiPerfProcessReq.context.closePath();
  }

  render(hiPerfProcessRequest: RequestMessage, list: Array<any>, filter: Array<any>, dataList2: Array<any>): void {}
}

export class HiPerfProcessStruct extends HiPerfStruct {
  static hoverStruct: HiPerfProcessStruct | undefined;
  static selectStruct: HiPerfProcessStruct | undefined;
}
