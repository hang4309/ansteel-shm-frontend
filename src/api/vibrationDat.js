import axios from "axios";

function getToken() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("accessToken") ||
    window.sessionStorage.getItem("token") ||
    window.sessionStorage.getItem("accessToken") ||
    ""
  );
}

function buildHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function postVibrationDatRawUpload(data) {
  return axios.post("/api/sensor/vibration-dat/raw/upload", data, { headers: buildHeaders() });
}

export function postVibrationDatLatest(data) {
  return axios.post("/api/data/vibration-dat/latest", data, { headers: buildHeaders() });
}

export function postVibrationDatHistory(data) {
  return axios.post("/api/data/vibration-dat/history", data, { headers: buildHeaders() });
}
