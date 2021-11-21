/**
 * axios 请求的公共信息进行提取
 */

let instance = axios.create();
instance.defaults.baseURL = 'https://127.0.0.1:8888'
instance.defaults.headers['Conten-Type'] = 'multipart/form-data'
instance.defaults.transformRequest = (data, headers) => {
    const contentType = headers['contentType']
    if (contentType === 'application/x-www-form-urlencoded') {
        return Qs.stringify(data) // 传递参数格式
    }
    return data    
}

// 响应拦截器
instance.interceptors.response.use( response => {
    return response.data
}, reason => {
    // 请求失败统一处理
    return Promise.reject(reason)
})

