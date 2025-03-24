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

#include "perf_sample_table.h"

namespace SysTuning {
namespace TraceStreamer {
enum class Index : int32_t {
    ID = 0,
    CALLCHAIN_ID,
    TIMESTAMP,
    THREAD_ID,
    EVENT_COUNT,
    EVENT_TYPE_ID,
    TIMESTAMP_TRACE,
    CPU_ID,
    THREAD_STATE
};
PerfSampleTable::PerfSampleTable(const TraceDataCache* dataCache) : TableBase(dataCache)
{
    tableColumn_.push_back(TableBase::ColumnInfo("id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("callchain_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("timeStamp", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("thread_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("event_count", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("event_type_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("timestamp_trace", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("cpu_id", "INTEGER"));
    tableColumn_.push_back(TableBase::ColumnInfo("thread_state", "TEXT"));
    tablePriKey_.push_back("id");
}

PerfSampleTable::~PerfSampleTable() {}

void PerfSampleTable::EstimateFilterCost(FilterConstraints& fc, EstimatedIndexInfo& ei)
{
    constexpr double filterBaseCost = 1000.0; // set-up and tear-down
    constexpr double indexCost = 2.0;
    ei.estimatedCost = filterBaseCost;

    auto rowCount = dataCache_->GetConstPerfSampleData().Size();
    if (rowCount == 0 || rowCount == 1) {
        ei.estimatedRows = rowCount;
        ei.estimatedCost += indexCost * rowCount;
        return;
    }

    double filterCost = 0.0;
    auto constraints = fc.GetConstraints();
    if (constraints.empty()) { // scan all rows
        filterCost = rowCount;
    } else {
        FilterByConstraint(fc, filterCost, rowCount);
    }
    ei.estimatedCost += filterCost;
    ei.estimatedRows = rowCount;
    ei.estimatedCost += rowCount * indexCost;

    ei.isOrdered = true;
    auto orderbys = fc.GetOrderBys();
    for (auto i = 0; i < orderbys.size(); i++) {
        switch (static_cast<Index>(orderbys[i].iColumn)) {
            case Index::ID:
                break;
            default: // other columns can be sorted by SQLite
                ei.isOrdered = false;
                break;
        }
    }
}

void PerfSampleTable::FilterByConstraint(FilterConstraints& fc, double& filterCost, size_t rowCount)
{
    auto fcConstraints = fc.GetConstraints();
    for (int32_t i = 0; i < static_cast<int32_t>(fcConstraints.size()); i++) {
        if (rowCount <= 1) {
            // only one row or nothing, needn't filter by constraint
            filterCost += rowCount;
            break;
        }
        const auto& c = fcConstraints[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID: {
                if (CanFilterId(c.op, rowCount)) {
                    fc.UpdateConstraint(i, true);
                    filterCost += 1; // id can position by 1 step
                } else {
                    filterCost += rowCount; // scan all rows
                }
                break;
            }
            default:                    // other column
                filterCost += rowCount; // scan all rows
                break;
        }
    }
}

std::unique_ptr<TableBase::Cursor> PerfSampleTable::CreateCursor()
{
    return std::make_unique<Cursor>(dataCache_, this);
}

PerfSampleTable::Cursor::Cursor(const TraceDataCache* dataCache, TableBase* table)
    : TableBase::Cursor(dataCache, table, static_cast<uint32_t>(dataCache->GetConstPerfSampleData().Size())),
      perfSampleObj_(dataCache->GetConstPerfSampleData())
{
}

PerfSampleTable::Cursor::~Cursor() {}

int32_t PerfSampleTable::Cursor::Filter(const FilterConstraints& fc, sqlite3_value** argv)
{
    // reset indexMap_
    indexMap_ = std::make_unique<IndexMap>(0, rowCount_);

    if (rowCount_ <= 0) {
        return SQLITE_OK;
    }

    auto& cs = fc.GetConstraints();
    for (size_t i = 0; i < cs.size(); i++) {
        const auto& c = cs[i];
        switch (static_cast<Index>(c.col)) {
            case Index::ID:
                FilterId(c.op, argv[i]);
                break;
            case Index::CALLCHAIN_ID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int64(argv[i])),
                                    perfSampleObj_.SampleIds());
                break;
            case Index::THREAD_ID:
                indexMap_->MixRange(c.op, static_cast<uint32_t>(sqlite3_value_int64(argv[i])), perfSampleObj_.Tids());
                break;
            case Index::EVENT_TYPE_ID:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[i])),
                                    perfSampleObj_.EventTypeIds());
                break;
            case Index::CPU_ID:
                indexMap_->MixRange(c.op, static_cast<uint64_t>(sqlite3_value_int64(argv[i])), perfSampleObj_.CpuIds());
                break;
            default:
                break;
        }
    }
    auto orderbys = fc.GetOrderBys();
    for (auto i = orderbys.size(); i > 0;) {
        i--;
        switch (static_cast<Index>(orderbys[i].iColumn)) {
            case Index::ID:
                indexMap_->SortBy(orderbys[i].desc);
                break;
            default:
                break;
        }
    }

    return SQLITE_OK;
}

int32_t PerfSampleTable::Cursor::Column(int32_t column) const
{
    switch (static_cast<Index>(column)) {
        case Index::ID:
            sqlite3_result_int64(context_, static_cast<int32_t>(perfSampleObj_.IdsData()[CurrentRow()]));
            break;
        case Index::CALLCHAIN_ID:
            if (perfSampleObj_.SampleIds()[CurrentRow()] != INVALID_UINT32) {
                sqlite3_result_int64(context_, static_cast<int64_t>(perfSampleObj_.SampleIds()[CurrentRow()]));
            } else {
                sqlite3_result_int64(context_, static_cast<int64_t>(INVALID_CALL_CHAIN_ID));
            }
            break;
        case Index::TIMESTAMP:
            sqlite3_result_int64(context_, static_cast<int64_t>(perfSampleObj_.TimeStampData()[CurrentRow()]));
            break;
        case Index::THREAD_ID:
            sqlite3_result_int64(context_, static_cast<int64_t>(perfSampleObj_.Tids()[CurrentRow()]));
            break;
        case Index::EVENT_COUNT:
            sqlite3_result_int64(context_, static_cast<int64_t>(perfSampleObj_.EventCounts()[CurrentRow()]));
            break;
        case Index::EVENT_TYPE_ID:
            sqlite3_result_int64(context_, static_cast<int64_t>(perfSampleObj_.EventTypeIds()[CurrentRow()]));
            break;
        case Index::TIMESTAMP_TRACE:
            sqlite3_result_int64(context_, static_cast<int64_t>(perfSampleObj_.TimestampTraces()[CurrentRow()]));
            break;
        case Index::CPU_ID:
            sqlite3_result_int64(context_, static_cast<int64_t>(perfSampleObj_.CpuIds()[CurrentRow()]));
            break;
        case Index::THREAD_STATE:
            if (perfSampleObj_.ThreadStates()[CurrentRow()] != INVALID_UINT64) {
                auto threadStateIndex = static_cast<size_t>(perfSampleObj_.ThreadStates()[CurrentRow()]);
                sqlite3_result_text(context_, dataCache_->GetDataFromDict(threadStateIndex).c_str(), STR_DEFAULT_LEN,
                                    nullptr);
            }
            break;
        default:
            TS_LOGF("Unregistered column : %d", column);
            break;
    }
    return SQLITE_OK;
}
} // namespace TraceStreamer
} // namespace SysTuning
