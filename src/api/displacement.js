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

export function getDisplacementLatest(params) {
  return axios.get("/api/data/displacement/latest", {
    params,
    headers: buildHeaders(),
  });
}

export function getDisplacementHistory(params) {
  return axios.get("/api/data/displacement/history", {
    params,
    headers: buildHeaders(),
  });
}
