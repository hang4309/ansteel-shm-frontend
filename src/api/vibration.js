import axios from "axios";

function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

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

  return (token ? { Authorization: `Bearer ${token}` } : {});
}

export function getVibrationLatest(data) {
  return axios.post("/api/data/vibration/latest", data, {
    headers: buildHeaders(),
  });
}

export function getVibrationHistory(data) {
  return axios.post("/api/data/vibration/history", data, {
    headers: buildHeaders(),
  });
}
