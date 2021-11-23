const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const multipartry = require('multiparty');
const SparkMD5 = require('spark-md5');
const path = require('path');
const app = express();
const PORT = 8888;
const HOST = 'http://127.0.0.1';
const HOSTNAME = `${HOST}:${PORT}`;
const FONTHOSTNAME = `${HOST}:${8000}`; // 前端起的服务

app.listen(PORT, () => {
    console.log(`serve is runnig at ${HOSTNAME}`);
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    req.method === 'OPITIONS'
        ? res.send('CURRENT SERVERICES SUPPORT CROSS DOMAIN REQUEST!')
        : next();
});

app.use(
    bodyParser.urlencoded({
        extended: false,
        limit: '1024mb',
    })
);

// 延迟函数
const delay = function (interval) {
    typeof interval !== 'number' ? interval === 1000 : interval;
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, interval);
    });
};

// 基于multiparty插件实现文件上传处理 & form-data解析
const uploadDir = `${__dirname}/upload`;
const baseDir = path.resolve(__dirname, '../');
const multipartry_load = function (req, auto) {
    typeof auto !== 'boolean' ? (auto = false) : null;
    let config = {
        maxFieldsSize: 200 * 1024 * 1024,
    };
    if (auto) config.uploadDir = uploadDir;
    return new Promise(async (resolve, reject) => {
        await delay(); //
        // 用来将客户端formData 结果解析
        new multipartry.Form(config).parse(req, (err, fields, files) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({
                fields,
                files,
            });
        });
    });
};

// 检测文件是否已经存在
const exists = function (path) {
    return new Promise((resolve) => {
        fs.access(path, fs.constants.F_OK, (err) => {
            if (err) resolve(false);
            return resolve(true);
        });
    });
};

// 创建文件并写入到指定的目录 & 返回客户端结果
const writeFile = function (res, path, file, filename, stream) {
    return new Promise((resolve, reject) => {
        if (stream) {
        }
        fs.writeFile(path, file, (err) => {
            if (err) {
                reject(err);
                res.send({
                    code: 1,
                    codeText: err,
                });
                return;
            }
            resolve();
            res.send({
                code: 0,
                codeText: '上传成功',
                filename: filename,
                url: path.replace(baseDir, FONTHOSTNAME),
            });
        });
    });
};

// 大文件上传 & 合并切片
const merge = (HASH, count) => {
    return new Promise( async (resolve, reject) => {
        let path = `${uploadDir}/${HASH}`
        let fileList = []
        let suffix
        let isExists = await exists(path); // 判断文件是否存在
        if(!isExists) {
            rject('HASH path  is not found!')
            return
        }
        fileList = fs.readdirSync(path);
        if (fileList.length < count) {
            reject('the slice has not been uploaded!')
            return
        }
        fileList.sort((a, b) => {
            let reg = /_(\d+)/;
            return reg.exec(a)[1] - reg.exec(b)[1];
        }).forEach(item => {
            !suffix ? suffix = /\.([0-9a-zA-Z]+)$/.exec(item)[1] : null // 处理文件后缀
            fs.appendFileSync(`${uploadDir}/${HASH}.${suffix}`, fs.readFileSync(`${path}/${item}`));
            fs.unlinkSync(`${path}/${item}`);
        })
        fs.rmdirSync(path) // 删除临时文件夹
        resolve({
            path: `${uploadDir}/${HASH}.${suffix}`,
            filename: `${HASH}.${suffix}`
        })
    })
}

app.post('/upload_single', async (req, res) => {
    try {
        let { files, fields } = await multipartry_load(req, true);
        let file = (files.file && files.file[0]) || {};
        res.send({
            code: 0,
            codeText: '上传成功',
            originFilename: file.originFilename,
            url: file.path.replace(baseDir, FONTHOSTNAME),
        });
    } catch (err) {
        res.send({
            code: 1,
            codeText: err,
        });
    }
});

app.post('/upload_single_base64', async (req, res) => {
    let file = req.body.file;
    let filename = req.body.filename;
    let spark = new SparkMD5.ArrayBuffer(); // 根据文件内容,生成一个hash名字
    let suffix = /\.([0-9a-zA-Z]+)$/.exec(filename)[1];
    let isExists = false;
    let path;
    file = decodeURIComponent(file);
    file = file.replace(/^data:image\/\w+;base64,/, '');
    file = Buffer.from(file, 'base64'); // 将base64转成正常的文件格式
    spark.append(file);
    path = `${uploadDir}/${spark.end()}.${suffix}`;
    await delay();
    // 检测是否存在
    isExists = await exists(path);
    if (isExists) {
        res.send({
            code: 0,
            codeText: 'file is exists',
            urlname: filename,
            url: path.replace(baseDir, FONTHOSTNAME),
        });
        return;
    }
    // fs.writeFile(res)
    writeFile(res, path, file, filename, false);
});

app.post('/upload_single_name', async (req, res) => {
    try {
        const { fields, files } = await multipartry_load(req);
        const file = (files.file && files.file[0]) || {};
        const filename = (fields.filename && fields.filename[0]) || '';
        const path = `${uploadDir}/${filename}`;
        let isExists = false;
        isExists = await exists(path);
        if (isExists) {
            res.send({
                code: 0,
                codeText: 'file is exists',
                url: path.replace(baseDir, FONTHOSTNAME),
            });
            return;
        }
        writeFile(res, path, file, filename, true);
    } catch (e) {
        res.send({
            code: 1,
            codeText: e,
        });
    }
});

/**
 * 上传切片
 */
app.post('/upload_chunk', async (req, res) => {
    try {
        const { fields, files } = await multipartry_load(req);
        const file = (files.file && files.file[0]) || {};
        const filename = (fields.filename && fields.filename[0]) || '';
        // const path = `${uploadDir}/${filename}`
        let isExists = false;
        // 创建存放切片的临时目录
        const [, HASH] = /^([^_]+)_(\d+)/.exec(filename);
        let path = `${uploadDir}/${HASH}`; // 用hash生成一个临时文件夹
        !fs.existsSync(path) ? fs.mkdirSync(path) : null; // 判断该文件夹是否存在，不存在的话，新建一个文件夹
        path = `${uploadDir}/${HASH}/${filename}`; // 将切片存到临时目录中
        isExists = await exists(path);
        if (isExists) {
            res.send({
                code: 0,
                codeText: 'file is already exists',
                url: path.replace(FONTHOSTNAME, HOSTNAME),
            });
            return;
        }
        writeFile(res, path, file, filename, true);
    } catch (e) {
        res.send({
            code: 1,
            codeText: e,
        });
    }
});

/**
 * 合并切片
 */
app.post('/upload_merge', async (req, res) => {
    const { HASH, count } = req.body;
    try {
        const { filname, path } = await merge(HASH, count);
        res.send({
            code: 0,
            codeText: 'merge sucessfully',
            url: path.replace(baseDir, FONTHOSTNAME),
        });
    } catch (e) {
        res.send({
            code: 1,
            codeText: e,
        });
    }
});


app.post('/upload_already', async (req, res) => {
    let { HASH } = req.body
    let path = `${uploadDir}/${HASH}`
    let fileList = []
    try {
        fileList = fs.readdirSync(path)
        fileList = fileList.sort((a, b) => {
            let reg = /_(\d+)/;
            return reg.exec(a)[1] - reg.exec(b)[1]
        })
        res.send({
            code: 0,
            codeText: '',
            fileList
        })
    } catch (e) {
        res.send({
            code: 1,
            codeText: e,
            fileList: []
        })
    }
})