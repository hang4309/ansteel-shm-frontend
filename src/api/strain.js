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

export function getStrainLatest(params) {
  return axios.get("/api/data/strain/latest", {
    params,
    headers: buildHeaders(),
  });
}

export function getStrainHistory(params) {
  return axios.get("/api/data/strain/history", {
    params,
    headers: buildHeaders(),
  });
}
