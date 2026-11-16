import axios from "axios";

/** Shared Axios instance for demo API mutations. Reads use SWR + fetch. */
export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});
