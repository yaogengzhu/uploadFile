# 文件上传

```bash
npm run start   # 启动前端
npm run server  # 启动后端
```

## 单个文件上传 form-data
主要是利用js form表单方式进行上传
```js
    let formData = new FormData();
    formData.append('file', _file);
    formData.append('filename', _file.name);
    instance
        .post('/upload_single', formData)
        .then((res) => {
            const { code } = res;
            if (code === 0) {
                alert('file 上传成功');
                return;
            }
            console.log(res);
            return Promise.reject(data.codeText);
        })
        .catch((e) => {
            console.log(e);
        });
```

## 单个文件上传 base64

```js
// 利用FildReader 得到文件的base64
/**
 * FileReader.readAsDataURL()开始读取指定的Blob中的内容。一旦完成，result属性中将包含一个data: URL格式的Base64字符串以表示所读取文件的内容。
 * **/
const getFileBase64 = (file) => {
    return new Promise((resolve) => {
        let fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = (e) => {
            resolve(e.target.result);
        };
    });
};

base64 = await getFileBase64(file);
upload_input.value = ''; // 用于初始化input
try {
    const data = await instance.post(
        '/upload_single_base64',
        {
            file: encodeURIComponent(base64), // 防止乱码问题  decodeURIComponent 对应
            filename: file.name,
        },
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );

    const { code } = data;
    if (code === 0) {
        alert('文件上传成功!');
    }
    throw data.codeText; // 抛出异常
} catch (e) {
    // 文件上传错误
} finally {
    //
}
```
## 单个文件上传 图片缩略图, 客户端自定义名字

```js
/**
 *
 * @param {} file
 * @returns
 * 根据内容生成hash名字
 */
//  SparkMD5 生成HASH
const getBufferByFile = (file) => {
    return new Promise((resolve) => {
        let fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = (e) => {
            let buffer = e.target.result;
            console.log(buffer);
            const spark = new SparkMD5.ArrayBuffer();
            spark.append(buffer);
            const HASH = spark.end();
            const suffix = /\.([0-9a-zA-Z]+)$/.exec(file.name)[1];
            console.log(HASH);
            resolve({
                buffer,
                HASH,
                suffix,
                filename: `${HASH}.${suffix}`,
            });
        };
    });
};
// 缩略图，可以用base64 来展示
const base64 = await getFileBase64(file);

const { filename } = await getFileBase64(_file);
    let formData = new FormData();
    formData.append('file', _file);
    formData.append('filename', filename); // 处理名字,服务端不提供名字编译
    instance
        .post('/upload_single_name', formData)
        .then((res) => {
            const { code } = res;
            if (code === 0) {
                alert('file 上传成功');
                return;
            }
            console.log(res);
            return Promise.reject(data.codeText);
        })
        .catch((e) => {
            console.log(e);
        });
});

```
## 单个文件上传 进度条管控
上传进度，主要是靠axios中回调
```js
try {
    let formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.filename);
    const data = await instance.post('/upload_single', formData, {
        // onPuloadProgress； 变化来更新进度
        onUploadProgress: (e) => {
            console.log(e);
            const { loaded, total } = e;
            console.log(
                `${(loaded / total) * 100}%`,
                ' `${loaded/total*100}%`'
            );
            upload_progress.style.display = 'block';
            upload_progrees_value.style.width = `${
                (loaded / total) * 100
            }%`;
        },
    });
    const { code } = data;
    if (code === 0) {
        upload_progrees_value.style.width = `100%`;
        alert('文件上传成功!');
        return;
    }
    throw data.codeText;
} catch (e) {
    //
    console.log(e);
    alert('文件上传失败');
} finally {
    this.value = '';
}

```
## 多个文件上传 进度条管控
 
主要是对上传列表做一个遍历上传。
结合Promise.all() 表示是否全部上传成功！
```js
const _files = files.map((item) => {
    const fm = new FormData();
    const curLi = upload_list_arr.find(
        (liBox) => liBox.getAttribute('key') === item.key
    );
    const curSpan = curLi
        ? curLi.querySelector('span:nth-last-child(1)')
        : null;
    fm.append('file', item.file);
    fm.append('filename', item.filename);
    return instance
        .post('/upload_single', fm, {
            onUploadProgress(e) {
                // 监听每一个上传进度
                const { loaded, total } = e;
                const progress = `${((loaded / total) * 100).toFixed(
                    2
                )}%`;
                if (curSpan) {
                    curSpan.innerText = progress;
                }
            },
        })
        .then((data) => {
            const { code } = data;
            if (code === 0) {
                if (curSpan) {
                    curSpan.innerText = '100%';
                }
                return Promise.resolve(data);
            }
            return Promise.reject(data.codeText);
        });
});
Promise.all(_files).then((res) => {
    console.log(res);
    alert('上传成功');
});
```

## 拖拽上传3

拖拽上传没有什么特殊的， 值得注意的是， drop 中的事件参数回携带 dataTransfer， 里面包含着 files。，提取出来，走上传即可！
```js
// 拖拽进入
dragBox.addEventListener('dragenter', function (e) {
    // console.log('拖拽进入')
    e.preventDefault();
    this.style.border = '1px solid red';
});

// 拖拽放下
dragBox.addEventListener('drop', function (e) {
    e.preventDefault();
    this.style.border = '';
    const {
        dataTransfer: { files },
    } = e;
    const file = files[0];
    uploadFile(file);
});

dragBox.addEventListener('dragover', function (e) {
    e.preventDefault();
});

```

## 切片上传

切片上传相对于上面，复杂一些, 当然也没有想象中的难！

1. 上传文件
2. 利用Bole.prototype.slice() 方法对文件进行切片， 对每一个文件进行HASH 唯一标识
3. 从服务器获取已经上传的切片，判断是否有些切片已经上传
4. 上传切片
5. 上传完切片，通知服务端合并切片

```js
 upload_button_upload.addEventListener('click', async function () {
    // 点击开始上传
    let chunkList = [];
    let alreadyChunkList = [];
    console.log(_file);
    let maxSize = 1024 * 1024;
    let maxCount = Math.ceil(_file.size / maxSize); // 最大允许分割的切片数量为30
    let index = 0;
    if (!_file) return alert('请先选择图片');
    const { HASH, suffix } = await changeBuffer(_file);
    // 判断当前文件可以切出多少切片
    if (maxCount > 10) {
        // 如果切片数量大于最大值
        maxSize = _file.size / 10; // 则改变切片大小
        maxCount = 10;
    }
    console.log(maxCount, 'maxCount');
    console.log(maxSize, 'maxSize');
    while (index < maxCount) {
        chunkList.push({
            file: _file.slice(index * maxSize, (index + 1) * maxSize),
            filename: `${HASH}_${index + 1}.${suffix}`,
        });
        index++;
    }

    // 先获取已经上传的切片
    const data = await instance.post(
        '/upload_already',
        {
            HASH: HASH,
        },
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );
    index = 0
    const complate = async () => {
        index++;
        let progress = `(${index}/${maxCount})%` // 进度条
        if (index >= maxCount) {
            console.log('ok, 切片完成')
        }
    }

    const { fileList } = data;
    alreadyChunkList = fileList
    console.log(chunkList, 'chunkList');
    chunkList = chunkList.map((item) => {
        if (alreadyChunkList.length > 0 && alreadyChunkList.includes(item.filename)) {
            debugger
            // 表示切片已经存在
            complate()
            return;
        }

        const fm = new FormData();
        fm.append('file', item.file);
        fm.append('filename', item.filename);
        return new Promise((sovle) => {
            instance
                .post('/upload_chunk', fm)
                .then(() => {
                    complate()
                    sovle();
                })
                .catch(() => {
                    //
                });
        });
    });
    Promise.all(chunkList).then(() => {
        instance
            .post(
                '/upload_merge',
                {
                    HASH: HASH,
                    count: maxCount,
                },
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            )
            .then((res) => {
                console.log('ok');
            });
    });
});
```