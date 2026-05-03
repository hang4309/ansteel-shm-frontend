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

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function postDeflectionLatest(data) {
  return axios.post("/api/data/deflection/latest", data, {
    headers: buildHeaders(),
  });
}

export function postDeflectionHistory(data) {
  return axios.post("/api/data/deflection/history", data, {
    headers: buildHeaders(),
  });
}
