import axios from "axios";

const client = axios.create({
    baseURL:"https://e52a-183-82-10-250.ngrok-free.app/"
})

export default client;