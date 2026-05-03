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

export function getVibrationLatest(params) {
  return axios.get("/api/data/vibration/latest", {
    params,
    headers: buildHeaders(),
  });
}

export function getVibrationHistory(params) {
  return axios.get("/api/data/vibration/history", {
    params,
    headers: buildHeaders(),
  });
}
