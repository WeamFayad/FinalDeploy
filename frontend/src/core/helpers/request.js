import axios from "axios";
import { local } from "./localstorage";

// Use REACT_APP_BACKEND_URL if defined; otherwise, fallback to localhost:8000
const baseURL = process.env.MONGODB_URL || "http://localhost:8000";
axios.defaults.baseURL = baseURL;

export const sendRequest = async ({ route, method = "GET", body }) => {
  const type = local("type");
  const token = local("token");

  const headers = {
    Authorization: `${type} ${token}`,
  };

  // so that if the body is an instance of FormData, don't set the Content-Type header
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await axios({
    method,
    url: route,
    data: body,
    headers,
  });

  return response.data;
};
