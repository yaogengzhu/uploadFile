const express = require('express')
const fs = require('fs')
const bodyParser = require('body-parser')
const multipartry = require('multiparty')
const SparkMD5 = require('spark-md5')

const app = express()
const PORT = 8888;
const HOST = 'http://127.0.0.1'
const HOSTNAME = `${HOST}:${PORT}`

app.listen(PORT, () => {
    console.log(`serve is runnig at ${HOSTNAME}`)
})


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    req.method === 'OPITIONS' ? res.send('CURRENT SERVERICES SUPPORT CROSS DOMAIN REQUEST!') : next()
})

app.use(bodyParser.urlencoded({
    extended: false,
    limit: '1024mb'
}))


// 延迟函数
const delay = function(interval) {
    typeof interval !== 'number' ? interval === 1000 : interval;
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, interval);
    })
}

// 基于multiparty插件实现文件上传处理 & form-data解析
const uploadDir = `${__dirname}/upload`
const multipartry_load = function(req, auto) {
    typeof auto !== 'boolean' ? auto = false : null
    let config = {
        maxFieldsSize: 200 * 1024 * 1024
    };
    if (auto) config.uploadDir = uploadDir
    return new Promise(async (resolve, reject) => {
        await delay() //
        // 用来将客户端formData 结果解析
        new multipartry.Form(config).parse(req, (err, fields, files) => {
            if(err) {
                reject(err)
                return
            }
            resolve({
                fields,
                files
            })
        })
    })
}

app.post('/upload_single', async(req, res) => {
    try {
        let { files, fields} = await multipartry_load(req, true)
        let file = (files.file && files.file[0]) || {}
        res.send({
            code: 0,
            codeText: '上传成功',
            originFilename: file.originFilename,
            url: file.path.replace(__dirname, HOSTNAME)
        })
    } catch(err) {
        res.send({
            code: 1,
            codeText: err
        })
    }
})
