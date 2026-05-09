<template>
  <div class="monitor-center-page">
    <div v-if="!activeModule" class="overview-page">
      <div class="overview-header">
        <h2 class="overview-title">吊车梁监测系统</h2>
        <p class="overview-subtitle">请选择监测模块进入数据页面</p>
      </div>

      <section class="overview-query">
        <div class="query-item">
          <label class="query-label">传感器ID</label>
          <input
            v-model="overviewQuery.sensorId"
            class="query-input"
            type="text"
            placeholder="请输入 sensorId"
            @keyup.enter="loadOverviewData"
          />
        </div>

        <div class="query-item">
          <label class="query-label">开始时间</label>
          <input
            v-model="overviewQuery.startTime"
            class="query-input"
            type="text"
            placeholder="yyyy-MM-dd HH:mm:ss"
            @keyup.enter="loadOverviewData"
          />
        </div>

        <div class="query-item">
          <label class="query-label">结束时间</label>
          <input
            v-model="overviewQuery.endTime"
            class="query-input"
            type="text"
            placeholder="yyyy-MM-dd HH:mm:ss"
            @keyup.enter="loadOverviewData"
          />
        </div>

        <button
          type="button"
          class="query-btn"
          :disabled="overviewLoading"
          @click="loadOverviewData"
        >
          {{ overviewLoading ? "加载中..." : "刷新总览数据" }}
        </button>
      </section>

      <div v-if="overviewError" class="overview-error">
        {{ overviewError }}
      </div>

      <div class="module-card-grid">
        <button
          v-for="module in allModules"
          :key="module.key"
          type="button"
          class="module-card"
          @click="openModule(module)"
        >
          <div class="card-header">
            <div>
              <div class="card-title">{{ module.label }}</div>
              <div class="card-subtitle">Y轴：{{ module.metric.label }}</div>
            </div>
            <span class="card-count">{{ getSeries(module).length }} 点</span>
          </div>

          <div class="chart-wrap">
            <svg class="mini-chart" viewBox="0 0 300 170" preserveAspectRatio="none">
              <line x1="52" y1="20" x2="52" y2="130" class="axis-line" />
              <line x1="52" y1="130" x2="280" y2="130" class="axis-line" />

              <text x="8" y="25" class="axis-value">{{ getChartStats(module).max }}</text>
              <text x="8" y="132" class="axis-value">{{ getChartStats(module).min }}</text>
              <text x="148" y="160" class="axis-title">X轴：采集时间</text>
              <text x="14" y="86" class="axis-title vertical-axis">Y轴</text>

              <polyline
                v-if="getChartPoints(module).length > 1"
                :points="getPolyline(module)"
                class="chart-polyline"
              />

              <circle
                v-for="point in getChartPoints(module)"
                :key="point.key"
                :cx="point.x"
                :cy="point.y"
                r="4"
                class="chart-point"
              />

              <text v-if="getChartPoints(module).length > 0" x="52" y="146" class="time-label">
                {{ getFirstTime(module) }}
              </text>

              <text
                v-if="getChartPoints(module).length > 1"
                x="280"
                y="146"
                text-anchor="end"
                class="time-label"
              >
                {{ getLastTime(module) }}
              </text>

              <text
                v-if="getChartPoints(module).length === 0"
                x="166"
                y="82"
                text-anchor="middle"
                class="empty-chart-text"
              >
                {{ overviewLoading ? "数据加载中..." : "暂无历史数据" }}
              </text>
            </svg>
          </div>

          <div class="card-footer">
            <span>最新值：{{ getLatestValue(module) }}</span>
            <span>{{ getLatestTime(module) }}</span>
          </div>
        </button>
      </div>
    </div>

    <div v-else class="detail-page">
      <div class="page-header">
        <div>
          <h2 class="page-title">{{ activeModuleLabel }}</h2>
          <p class="page-subtitle">{{ activeModuleConfig.desc }}</p>
        </div>

        <div class="page-actions">
          <button type="button" class="back-btn" @click="backToOverview">返回模块总览</button>
          <span class="page-badge">{{ activeCategoryLabel }}</span>
          <span class="page-badge page-badge-dark">V{{ activeModuleConfig.version }}</span>
        </div>
      </div>

      <MonitorInnerNav
        :categories="categories"
        :active-category="activeCategory"
        :modules="currentModules"
        :active-module="activeModule"
        @change-category="handleCategoryChange"
        @change-module="handleModuleChange"
      />

      <section class="module-content">
        <transition name="fade" mode="out-in">
          <component :is="activeComponent" :key="activeModule" />
        </transition>
      </section>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { computed, defineAsyncComponent, onMounted, reactive, ref } from "vue";
import MonitorInnerNav from "@/components/monitor/MonitorInnerNav.vue";

const moduleConfigs = {
  displacement: {
    label: "位移数据（mm）",
    shortLabel: "位移",
    component: "Displacement",
    desc: "传感器直采位移数据实时监控",
    version: "1.0",
    category: "direct",
    metric: {
      key: "verticalDeflection",
      label: "位移 / 垂向挠度",
      aliases: [
        "verticalDeflection",
        "displacementValue",
        "horizontalDisplacement",
        "midspanDisplacement",
      ],
    },
  },
  acceleration: {
    label: "加速度数据",
    shortLabel: "加速度",
    component: "Acceleration",
    desc: "传感器直采加速度数据实时监控",
    version: "1.0",
    category: "direct",
    metric: {
      key: "accelerationValue",
      label: "加速度值",
      aliases: ["accelerationValue", "acceleration"],
    },
  },
  strain: {
    label: "应变数据",
    shortLabel: "应变",
    component: "Strain",
    desc: "传感器直采应变数据实时监控",
    version: "1.0",
    category: "direct",
    metric: {
      key: "microStrain",
      label: "微应变",
      aliases: ["microStrain", "strainValue", "keyPointStrain"],
    },
  },
  vibration: {
    label: "振动数据",
    shortLabel: "振动",
    component: "Vibration",
    desc: "传感器直采振动数据实时监控",
    version: "1.0",
    category: "direct",
    metric: {
      key: "amplitude",
      label: "振幅",
      aliases: ["amplitude", "vibrationValue", "frequency", "acceleration"],
    },
  },
  vibratingWire: {
    label: "振弦原始数据",
    shortLabel: "振弦",
    component: "VibratingWire",
    desc: "振弦采集仪原始接入与查询",
    version: "1.0",
    category: "direct",
    metric: {
      key: "frequency",
      label: "频率",
      aliases: ["frequency", "temperature", "tension", "strainValue"],
    },
  },
  fiber: {
    label: "光纤原始数据",
    shortLabel: "光纤",
    component: "Fiber",
    desc: "OS-265 光纤原始入口，仅做结构接入",
    version: "1.0",
    category: "direct",
    metric: {
      key: "rawValue",
      label: "原始值",
      aliases: ["rawValue", "wavelength", "wavelengthShift", "intensity"],
    },
  },
  vibrationDat: {
    label: "振动DAT",
    shortLabel: "DAT",
    component: "VibrationDat",
    desc: "振动 DAT 文件级接入与查询",
    version: "1.0",
    category: "direct",
    metric: {
      key: "fileSize",
      label: "文件大小",
      aliases: ["fileSize", "sampleRate", "channelCount", "pointCount", "durationSeconds"],
    },
  },
  deflection: {
    label: "挠度数据（mm）",
    shortLabel: "挠度",
    component: "Deflection",
    desc: "计算结果类挠度数据监控",
    version: "1.0",
    category: "calc",
    metric: {
      key: "deflectionValue",
      label: "挠度值",
      aliases: ["deflectionValue", "verifiedDeflection", "calcDeflection", "verticalDeflection"],
    },
  },
  stress: {
    label: "应力数据（MPa）",
    shortLabel: "应力",
    component: "Stress",
    desc: "计算结果类应力数据监控",
    version: "2.0",
    category: "calc",
    metric: {
      key: "principalStress",
      label: "主应力",
      aliases: ["principalStress", "verifiedStress", "calcStress", "equivalentStress"],
    },
  },
};

const categories = [
  { key: "direct", label: "传感器直采" },
  { key: "calc", label: "计算结果" },
];

const moduleMap = {
  direct: ["displacement", "acceleration", "strain", "vibration", "vibratingWire", "fiber", "vibrationDat"],
  calc: ["deflection", "stress"],
};

const allModules = computed(() => [
  { key: "displacement", ...moduleConfigs.displacement },
  { key: "acceleration", ...moduleConfigs.acceleration },
  { key: "strain", ...moduleConfigs.strain },
  { key: "vibration", ...moduleConfigs.vibration },
  { key: "vibratingWire", ...moduleConfigs.vibratingWire },
  { key: "fiber", ...moduleConfigs.fiber },
  { key: "vibrationDat", ...moduleConfigs.vibrationDat },
  { key: "deflection", ...moduleConfigs.deflection },
  { key: "stress", ...moduleConfigs.stress },
]);

const componentsMap = {
  Displacement: defineAsyncComponent(() => import("./displacement/DisplacementMonitorPage.vue")),
  Acceleration: defineAsyncComponent(() => import("./acceleration/AccelerationMonitorPage.vue")),
  Strain: defineAsyncComponent(() => import("./strain/StrainMonitorPage.vue")),
  Vibration: defineAsyncComponent(() => import("./vibration/VibrationMonitorPage.vue")),
  VibratingWire: defineAsyncComponent(() => import("./vibrating-wire/VibratingWireMonitorPage.vue")),
  Fiber: defineAsyncComponent(() => import("./fiber/FiberMonitorPage.vue")),
  VibrationDat: defineAsyncComponent(() => import("./vibration-dat/VibrationDatMonitorPage.vue")),
  Deflection: defineAsyncComponent(() => import("./deflection/DeflectionMonitorPage.vue")),
  Stress: defineAsyncComponent(() => import("./stress/StressMonitorPage.vue")),
};

const activeCategory = ref("direct");
const activeModule = ref("");
const overviewLoading = ref(false);
const overviewError = ref("");

const overviewQuery = reactive({
  sensorId: "SENSOR_001",
  startTime: getYearStartTime(),
  endTime: getCurrentTime(),
  limit: 50,
});

const overviewData = reactive({
  displacement: [],
  acceleration: [],
  strain: [],
  vibration: [],
  vibratingWire: [],
  fiber: [],
  vibrationDat: [],
  deflection: [],
  stress: [],
});

const timePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const currentModules = computed(() => {
  return (moduleMap[activeCategory.value] || []).map((key) => ({
    key,
    label: moduleConfigs[key]?.shortLabel || moduleConfigs[key]?.label || key,
  }));
});

const activeModuleConfig = computed(() => moduleConfigs[activeModule.value] || {});
const activeModuleLabel = computed(() => activeModuleConfig.value.label || "模块页面");
const activeCategoryLabel = computed(
  () => categories.find((item) => item.key === activeCategory.value)?.label || "监测数据",
);

const activeComponent = computed(() => {
  return componentsMap[activeModuleConfig.value.component] || null;
});

onMounted(() => {
  loadOverviewData();
});

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDateTime(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getYearStartTime() {
  const now = new Date();
  return `${now.getFullYear()}-01-01 00:00:00`;
}

function getCurrentTime() {
  return formatDateTime(new Date());
}

function validateOverviewQuery() {
  if (!overviewQuery.sensorId || !String(overviewQuery.sensorId).trim()) {
    overviewError.value = "传感器ID不能为空";
    return false;
  }

  if (!timePattern.test(overviewQuery.startTime)) {
    overviewError.value = "开始时间格式必须为 yyyy-MM-dd HH:mm:ss";
    return false;
  }

  if (!timePattern.test(overviewQuery.endTime)) {
    overviewError.value = "结束时间格式必须为 yyyy-MM-dd HH:mm:ss";
    return false;
  }

  if (overviewQuery.startTime > overviewQuery.endTime) {
    overviewError.value = "开始时间不能大于结束时间";
    return false;
  }

  overviewError.value = "";
  return true;
}

async function loadOverviewData() {
  if (!validateOverviewQuery()) {
    return;
  }

  overviewLoading.value = true;
  overviewError.value = "";

  try {
    await Promise.all(
      allModules.value.map(async (module) => {
        overviewData[module.key] = await requestModuleHistory(module.key);
      }),
    );
  } catch (error) {
    overviewError.value = error?.message || "模块总览数据加载失败";
  } finally {
    overviewLoading.value = false;
  }
}

async function requestModuleHistory(moduleKey) {
  const payload = {
    sensorId: String(overviewQuery.sensorId).trim(),
    startTime: overviewQuery.startTime,
    endTime: overviewQuery.endTime,
    limit: Number(overviewQuery.limit),
    page: 1,
    size: Number(overviewQuery.limit),
  };

  try {
    const postResponse = await axios.post(`/api/data/${moduleKey}/history`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return normalizeArray(unwrapResultData(postResponse));
  } catch (postError) {
    const status = postError?.response?.status;

    if (status && status !== 404 && status !== 405) {
      return [];
    }

    try {
      const getResponse = await axios.get(`/api/data/${moduleKey}/history`, {
        params: payload,
      });

      return normalizeArray(unwrapResultData(getResponse));
    } catch {
      return [];
    }
  }
}

function unwrapResultData(response) {
  const responseData = response?.data;

  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return responseData.data;
  }

  return responseData;
}

function normalizeArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.records)) {
    return data.records;
  }

  if (data && Array.isArray(data.rows)) {
    return data.rows;
  }

  if (data && Array.isArray(data.list)) {
    return data.list;
  }

  if (data && Array.isArray(data.content)) {
    return data.content;
  }

  return [];
}

function toSnakeCase(value) {
  return String(value).replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function readField(item, metric) {
  const keys = metric.aliases || [metric.key];

  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== "") {
      return item[key];
    }

    const snakeKey = toSnakeCase(key);
    if (item?.[snakeKey] !== undefined && item?.[snakeKey] !== null && item?.[snakeKey] !== "") {
      return item[snakeKey];
    }
  }

  return null;
}

function getSeries(module) {
  return (overviewData[module.key] || [])
    .map((item, index) => {
      const value = Number(readField(item, module.metric));

      if (Number.isNaN(value)) {
        return null;
      }

      return {
        key: `${module.key}-${item.sensorId || "sensor"}-${item.collectTime || index}-${index}`,
        value,
        collectTime: item.collectTime || item.collect_time || "",
      };
    })
    .filter(Boolean);
}

function getChartStats(module) {
  const series = getSeries(module);

  if (series.length === 0) {
    return {
      min: "-",
      max: "-",
    };
  }

  const values = series.map((item) => item.value);

  return {
    min: formatAxisValue(Math.min(...values)),
    max: formatAxisValue(Math.max(...values)),
  };
}

function getChartPoints(module) {
  const series = getSeries(module);

  if (series.length === 0) {
    return [];
  }

  const startX = 58;
  const endX = 276;
  const startY = 26;
  const endY = 124;

  const values = series.map((item) => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const stepX = series.length > 1 ? (endX - startX) / (series.length - 1) : 0;

  return series.map((item, index) => {
    const x = series.length === 1 ? (startX + endX) / 2 : startX + index * stepX;
    const y = endY - ((item.value - minValue) / range) * (endY - startY);

    return {
      ...item,
      x,
      y,
    };
  });
}

function getPolyline(module) {
  return getChartPoints(module)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}

function getFirstTime(module) {
  const series = getSeries(module);
  return formatShortTime(series[0]?.collectTime);
}

function getLastTime(module) {
  const series = getSeries(module);
  return formatShortTime(series[series.length - 1]?.collectTime);
}

function getLatestValue(module) {
  const series = getSeries(module);
  const latest = series[series.length - 1];

  if (!latest) {
    return "-";
  }

  return formatAxisValue(latest.value);
}

function getLatestTime(module) {
  const series = getSeries(module);
  const latest = series[series.length - 1];

  if (!latest) {
    return "暂无时间";
  }

  return formatShortTime(latest.collectTime);
}

function formatShortTime(value) {
  if (!value || typeof value !== "string") {
    return "--";
  }

  const parts = value.split(" ");
  return parts.length === 2 ? parts[1] : value;
}

function formatAxisValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return String(value);
  }

  if (Math.abs(numberValue) >= 1000) {
    return numberValue.toFixed(0);
  }

  if (Math.abs(numberValue) >= 100) {
    return numberValue.toFixed(1);
  }

  return numberValue.toFixed(2);
}

function openModule(module) {
  activeModule.value = module.key;
  activeCategory.value = module.category;
}

function backToOverview() {
  activeModule.value = "";
}

function handleCategoryChange(key) {
  activeCategory.value = key;
  const firstModule = moduleMap[key]?.[0];
  if (firstModule) {
    activeModule.value = firstModule;
  }
}

function handleModuleChange(key) {
  activeModule.value = key;
}
</script>

<style scoped>
.monitor-center-page {
  min-height: 100%;
}

.overview-page,
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.overview-header {
  text-align: center;
  padding-top: 8px;
}

.overview-title {
  margin: 0;
  font-size: 30px;
  color: #111827;
  font-weight: 800;
}

.overview-subtitle {
  margin: 10px 0 0;
  font-size: 14px;
  color: #6b7280;
}

.overview-query {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 12px;
  align-items: end;
  padding: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
}

.query-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.query-label {
  font-size: 13px;
  color: #4b5563;
}

.query-input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  outline: none;
  color: #111827;
}

.query-input:focus {
  border-color: #2563eb;
}

.query-btn {
  height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 10px;
  background: #111827;
  color: #ffffff;
  cursor: pointer;
  font-weight: 600;
}

.query-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.overview-error {
  padding: 12px 16px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 14px;
}

.module-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.module-card {
  min-height: 230px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.module-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.card-title {
  font-size: 18px;
  font-weight: 800;
  color: #111827;
}

.card-subtitle {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.card-count {
  flex-shrink: 0;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
}

.chart-wrap {
  width: 100%;
}

.mini-chart {
  display: block;
  width: 100%;
  height: 160px;
  border-radius: 12px;
  background: #fcfcfd;
  border: 1px solid #eef2f7;
}

.axis-line {
  stroke: #9ca3af;
  stroke-width: 1.2;
}

.axis-value {
  font-size: 11px;
  fill: #6b7280;
}

.axis-title {
  font-size: 11px;
  fill: #4b5563;
}

.vertical-axis {
  writing-mode: tb;
}

.chart-polyline {
  fill: none;
  stroke: #2563eb;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-point {
  fill: #111827;
}

.time-label {
  font-size: 10px;
  fill: #6b7280;
}

.empty-chart-text {
  font-size: 13px;
  fill: #9ca3af;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  font-size: 12px;
  color: #4b5563;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 26px;
  color: #111827;
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: #6b7280;
}

.page-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}

.back-btn {
  height: 34px;
  padding: 0 14px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.back-btn:hover {
  background: #f3f4f6;
}

.page-badge {
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 12px;
  font-weight: 600;
}

.page-badge-dark {
  background: #111827;
  color: #ffffff;
}

.module-content {
  min-height: 300px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1200px) {
  .overview-query {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .module-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .overview-query {
    grid-template-columns: 1fr;
  }

  .module-card-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-actions {
    justify-content: flex-start;
  }
}
</style>
