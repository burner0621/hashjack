import axios from 'axios';

export const getRequest = async (url) => {
    try {
        const res = await axios.get(url);
        // console.log('getRequest log - 1 : ', res.data);
        return res.data;
    } catch (error) {
        // console.error('getRequest log - 2 : ', { result: false, error: error });
        return { result: false, error: error.message };
    }
}

export const postRequest = async (url, data) => {
    try {
        const res = await axios.post(url, data);
        // console.log('getRequest log - 1 : ', res.data);
        return res.data;
    } catch (error) {
        // console.error('getRequest log - 2 : ', { result: false, error: error });
        return { result: false, error: error.message };
    }
}