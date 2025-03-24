/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
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
#include "htrace_js_cpu_profiler_parser.h"
#include "clock_filter_ex.h"

namespace SysTuning {
namespace TraceStreamer {
const uint32_t TIME_SECOND_COVER = 1000;
namespace jsonns {

struct CallFrame {
    std::string functionName;
    std::string scriptId;
    std::string url;
    int32_t lineNumber;
    int32_t columnNumber;
};
struct Node {
    uint32_t id;
    CallFrame callFrame;
    uint32_t hitCount;
    std::string children;
};
void from_json(const json& j, CallFrame& callFrame)
{
    j.at("functionName").get_to(callFrame.functionName);
    j.at("scriptId").get_to(callFrame.scriptId);
    j.at("url").get_to(callFrame.url);
    j.at("lineNumber").get_to(callFrame.lineNumber);
    j.at("columnNumber").get_to(callFrame.columnNumber);
    return;
}
std::map<int, int> nodes_;
void from_json(const json& j, Node& node)
{
    j.at("id").get_to(node.id);
    j.at("callFrame").get_to(node.callFrame);
    j.at("hitCount").get_to(node.hitCount);
    for (size_t i = 0; i < j["children"].size(); i++) {
        int child = j["children"][i];
        nodes_.emplace(child, node.id);
        auto children = std::to_string(child);
        node.children += children + ",";
    }
    return;
}
} // namespace jsonns

HtraceJsCpuProfilerParser::HtraceJsCpuProfilerParser(TraceDataCache* dataCache, const TraceStreamerFilters* ctx)
    : EventParserBase(dataCache, ctx)
{
}

void HtraceJsCpuProfilerParser::ParseNodeData(const json& jMessage)
{
    int nodeCount = jMessage.at("nodes").size();
    for (int i = 0; i < nodeCount; i++) {
        jsonns::Node node = jMessage.at("nodes")[i];
        auto id = node.id;
        auto functionName = node.callFrame.functionName;
        DataIndex functionNameKey = traceDataCache_->GetDataIndex(functionName);
        auto scriptId = node.callFrame.scriptId;
        auto url = node.callFrame.url;
        DataIndex urlKey = traceDataCache_->GetDataIndex(url);
        auto lineNumber = node.callFrame.lineNumber;
        auto columnNumber = node.callFrame.columnNumber;
        auto hitCount = node.hitCount;
        auto children = node.children;
        children = children.substr(0, children.size() - 1);
        uint32_t parentId = 0;
        if (jsonns::nodes_.find(id) != jsonns::nodes_.end()) {
            parentId = jsonns::nodes_.find(id)->second;
        }
        (void)traceDataCache_->GetJsCpuProfilerNodeData()->AppendNewData(
            id, functionNameKey, scriptId, urlKey, lineNumber, columnNumber, hitCount, children, parentId);
    }
}
uint32_t HtraceJsCpuProfilerParser::ParseSampleData(const json& jMessage,
                                                    uint64_t& sampleEndTime,
                                                    uint64_t& startTime,
                                                    uint64_t startTimeSnap,
                                                    uint64_t endTimeSnap)
{
    uint64_t dur = 0;
    uint64_t splitStartTime = startTime * TIME_SECOND_COVER;
    uint32_t sample = std::numeric_limits<uint32_t>::max();
    json filteredSamples = nlohmann::json::array();
    json filteredTimeDeltas = nlohmann::json::array();
    filteredTimeDeltas.push_back(jMessage.at("timeDeltas")[0]);
    startTimeSnap = streamFilters_->clockFilter_->Convert(TS_CLOCK_BOOTTIME, startTimeSnap, TS_MONOTONIC);
    endTimeSnap = streamFilters_->clockFilter_->Convert(TS_CLOCK_BOOTTIME, endTimeSnap, TS_MONOTONIC);
    for (size_t i = 0; i < jMessage.at("samples").size(); i++) {
        if (traceDataCache_->isSplitFile_ && i < jMessage.at("timeDeltas").size()) {
            uint64_t splitTimeDeltas = jMessage.at("timeDeltas")[i];
            splitTimeDeltas = splitTimeDeltas * TIME_SECOND_COVER;
            uint64_t timeSnap = splitStartTime + splitTimeDeltas;
            if (timeSnap >= startTimeSnap && timeSnap <= endTimeSnap) {
                filteredSamples.push_back(jMessage.at("samples")[i]);
                filteredTimeDeltas.push_back(jMessage.at("timeDeltas")[i]);
                if (startTime_ == INVALID_UINT64) {
                    startTime_ = splitStartTime;
                }
            }
            splitStartTime = timeSnap;
            continue;
        }
        if (sample != std::numeric_limits<uint32_t>::max() && sample != jMessage.at("samples")[i]) {
            dur = (sampleEndTime * TIME_SECOND_COVER) - (startTime * TIME_SECOND_COVER);
            auto startNewTime =
                streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_MONOTONIC, startTime * TIME_SECOND_COVER);
            UpdatePluginTimeRange(TS_MONOTONIC, startNewTime, startNewTime);
            auto endNewTime =
                streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_MONOTONIC, sampleEndTime * TIME_SECOND_COVER);
            UpdatePluginTimeRange(TS_MONOTONIC, endNewTime, endNewTime);
            if (!traceDataCache_->isSplitFile_) {
                (void)traceDataCache_->GetJsCpuProfilerSampleData()->AppendNewData(sample, startNewTime, endNewTime,
                                                                                   dur);
            }
            sample = jMessage.at("samples")[i];
            startTime = sampleEndTime;
        } else if (sample == std::numeric_limits<uint32_t>::max()) {
            sample = jMessage.at("samples")[0];
        }
        if (i + 1 < jMessage.at("timeDeltas").size()) {
            uint32_t timeDeltas = jMessage.at("timeDeltas")[i + 1];
            sampleEndTime += timeDeltas;
        }
    }
    updatedJson_["samples"] = filteredSamples;
    updatedJson_["timeDeltas"] = filteredTimeDeltas;
    updatedJson_["startTime"] = startTime_ / TIME_SECOND_COVER;
    startTime_ = INVALID_UINT64;
    return sample;
}
void HtraceJsCpuProfilerParser::ParseJsCpuProfiler(std::string result, uint64_t startTimeSnap, uint64_t endTimeSnap)
{
    if (result.empty()) {
        return;
    }
    json jMessage = json::parse(result);
    if (traceDataCache_->isSplitFile_) {
        for (auto item : jMessage.items()) {
            if (item.key() != "samples" && item.key() != "timeDeltas") {
                updatedJson_[item.key()] = item.value();
            }
        }
    }
    ParseNodeData(jMessage);
    uint64_t startTime = jMessage.at("startTime");
    uint64_t sampleEndTime = startTime;
    uint32_t sample = ParseSampleData(jMessage, sampleEndTime, startTime, startTimeSnap, endTimeSnap);
    uint64_t dur = (sampleEndTime * TIME_SECOND_COVER) - (startTime * TIME_SECOND_COVER);
    auto startNewTime = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_MONOTONIC, startTime * TIME_SECOND_COVER);
    UpdatePluginTimeRange(TS_MONOTONIC, startNewTime, startNewTime);
    auto endNewTime = streamFilters_->clockFilter_->ToPrimaryTraceTime(TS_MONOTONIC, sampleEndTime * TIME_SECOND_COVER);
    UpdatePluginTimeRange(TS_MONOTONIC, endNewTime, endNewTime);
    if (!traceDataCache_->isSplitFile_) {
        (void)traceDataCache_->GetJsCpuProfilerSampleData()->AppendNewData(sample, startNewTime, endNewTime, dur);
    }
}
} // namespace TraceStreamer
} // namespace SysTuning
