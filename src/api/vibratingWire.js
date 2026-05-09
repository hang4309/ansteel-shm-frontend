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

export function postVibratingWireRawUpload(data) {
  return axios.post("/api/sensor/vibrating-wire/raw/upload", data, { headers: buildHeaders() });
}

export function postVibratingWireLatest(data) {
  return axios.post("/api/data/vibrating-wire/latest", data, { headers: buildHeaders() });
}

export function postVibratingWireHistory(data) {
  return axios.post("/api/data/vibrating-wire/history", data, { headers: buildHeaders() });
}
