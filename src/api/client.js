import axios from "axios";

const client = axios.create({
    baseURL:"https://44b9-183-82-10-250.ngrok-free.app"
})

export default client;