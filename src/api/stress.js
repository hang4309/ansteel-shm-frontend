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

export function getStressLatest(data) {
  return axios.post("/api/data/stress/latest", data, {
    headers: buildHeaders(),
  });
}

export function getStressHistory(data) {
  return axios.post("/api/data/stress/history", data, {
    headers: buildHeaders(),
  });
}
