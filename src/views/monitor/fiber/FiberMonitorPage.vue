<template>
  <div class="fiber-page">
    <div class="page-header"><div><h2 class="page-title">光纤原始监测</h2><p class="page-subtitle">OS-265 原始入口</p></div><div class="page-badge">FiberMonitorPage</div></div>
    <QueryBar v-model="queryForm" :loading="loading" :error-message="errorMessage" @query="handleQuery" />
    <section class="section-card">
      <div class="section-header"><h3 class="section-title">最新数据</h3><span class="section-tag">latest</span></div>
      <div v-if="latestData" class="data-grid">
        <div class="data-item"><div class="data-label">传感器ID</div><div class="data-value">{{ latestData.sensorId || "-" }}</div></div>
        <div class="data-item"><div class="data-label">设备编号</div><div class="data-value">{{ latestData.deviceNo || "-" }}</div></div>
        <div class="data-item"><div class="data-label">光纤编号</div><div class="data-value">{{ latestData.fiberNo || "-" }}</div></div>
        <div class="data-item"><div class="data-label">原始值</div><div class="data-value">{{ formatDisplayValue(latestData.rawValue) }}</div></div>
        <div class="data-item"><div class="data-label">波长</div><div class="data-value">{{ formatDisplayValue(latestData.wavelength) }}</div></div>
        <div class="data-item"><div class="data-label">波长变化</div><div class="data-value">{{ formatDisplayValue(latestData.wavelengthShift) }}</div></div>
        <div class="data-item"><div class="data-label">强度</div><div class="data-value">{{ formatDisplayValue(latestData.intensity) }}</div></div>
        <div class="data-item data-item-wide"><div class="data-label">采集时间</div><div class="data-value">{{ latestData.collectTime || "-" }}</div></div>
      </div>
      <div v-else class="empty-block">{{ loading ? "加载中..." : "暂无数据" }}</div>
    </section>
    <section class="section-card">
      <div class="section-header"><h3 class="section-title">历史明细</h3><span class="section-tag">共{{ historyList.length }}条</span></div>
      <div v-if="historyList.length" class="table-wrapper">
        <table class="history-table"><thead><tr><th>传感器ID</th><th>设备编号</th><th>光纤编号</th><th>原始值</th><th>波长</th><th>波长变化</th><th>强度</th><th>采集时间</th></tr></thead>
        <tbody><tr v-for="(item,index) in historyList" :key="`${item.sensorId || 'row'}-${index}`"><td>{{ item.sensorId || "-" }}</td><td>{{ item.deviceNo || "-" }}</td><td>{{ item.fiberNo || "-" }}</td><td>{{ formatDisplayValue(item.rawValue) }}</td><td>{{ formatDisplayValue(item.wavelength) }}</td><td>{{ formatDisplayValue(item.wavelengthShift) }}</td><td>{{ formatDisplayValue(item.intensity) }}</td><td>{{ item.collectTime || "-" }}</td></tr></tbody></table>
      </div>
      <div v-else class="empty-block">{{ loading ? "加载中..." : "暂无历史数据" }}</div>
    </section>
  </div>
</template>
<script setup>
import { ref } from "vue"; import QueryBar from "@/components/monitor/QueryBar.vue"; import { postFiberHistory, postFiberLatest } from "@/api/fiber";
defineOptions({ name: "FiberMonitorPage" }); const loading=ref(false), errorMessage=ref(""), latestData=ref(null), historyList=ref([]);
const queryForm=ref({sensorId:"",startTime:getTodayStartTime(),endTime:getCurrentTime(),limit:100}); function pad(v){return String(v).padStart(2,"0");} function formatDateTime(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;} function getTodayStartTime(){const n=new Date(); return `${n.getFullYear()}-${pad(n.getMonth()+1)}-${pad(n.getDate())} 00:00:00`;} function getCurrentTime(){return formatDateTime(new Date());} function unwrap(r){const d=r?.data; return d && typeof d==="object" && "data" in d ? d.data : d;} function formatDisplayValue(v){return v===null||v===undefined||v===""?"-":v;}
async function handleQuery(){ if(!queryForm.value.sensorId?.trim()){ errorMessage.value="传感器ID不能为空"; return; } loading.value=true; errorMessage.value=""; try { const sid=String(queryForm.value.sensorId).trim(); latestData.value=unwrap(await postFiberLatest({sensorId:sid})); const hist=unwrap(await postFiberHistory({sensorId:sid,startTime:queryForm.value.startTime,endTime:queryForm.value.endTime,limit:Number(queryForm.value.limit)})); historyList.value=Array.isArray(hist)?hist:[]; } catch(e){ errorMessage.value=e?.response?.data?.message||e?.message||"查询失败"; latestData.value=null; historyList.value=[]; } finally { loading.value=false; } }
</script>
<style scoped>
.fiber-page{display:flex;flex-direction:column;gap:20px}.page-header{display:flex;justify-content:space-between;gap:16px}.page-title{margin:0;font-size:28px;color:#111827}.page-subtitle{margin:8px 0 0;color:#6b7280}.page-badge{height:34px;padding:0 14px;border-radius:999px;background:#111827;color:#fff;display:inline-flex;align-items:center}.section-card{padding:20px;border:1px solid #e5e7eb;border-radius:16px;background:#fff}.section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.section-title{margin:0;font-size:18px}.section-tag{background:#f3f4f6;padding:6px 12px;border-radius:999px}.data-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.data-item{padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa}.data-item-wide{grid-column:span 4}.data-label{font-size:12px;color:#6b7280;margin-bottom:8px}.empty-block{min-height:92px;display:flex;align-items:center;justify-content:center;border:1px dashed #d1d5db;border-radius:12px;background:#fafafa;color:#6b7280}.table-wrapper{overflow-x:auto}.history-table{width:100%;border-collapse:collapse}.history-table th,.history-table td{padding:12px 10px;border-bottom:1px solid #e5e7eb;text-align:left}.history-table th{background:#fafafa}@media (max-width:1280px){.data-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.data-item-wide{grid-column:span 2}}@media (max-width:900px){.page-header,.section-header{flex-direction:column;align-items:flex-start}.data-grid{grid-template-columns:1fr}.data-item-wide{grid-column:span 1}}
</style>
