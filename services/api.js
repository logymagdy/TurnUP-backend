import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.x.x:3000/api",
});

export default API;