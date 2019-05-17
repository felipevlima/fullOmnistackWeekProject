import axios from 'axios';

const api = axios.create({
    baseURL: 'https://omnistackfelipe.herokuapp.com',
});

export default api;