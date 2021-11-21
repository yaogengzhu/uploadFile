(function() {
    let upload = document.querySelector('#upload1')
    let upload_input = upload.querySelector('.upload_ipt')
    let upload_button_select = upload.querySelector('.upload_button.select')
    let upload_button_upload = upload.querySelector('.upload_button.upload')
    let upload_tip = upload.querySelector('.upload_tip')
    let upload_list = upload.querySelector('.upload_list')

    let _file = null // 初始化文件
    // 移除按钮
    upload_list.addEventListener('click', function(e) {
        let target = e.target
        // 事件委托, 提高页面性能
        if (target.tagName === 'EM') {
            // 点击的是移除按钮
            upload_list.innerHTML = ''
            upload_tip.style.display = 'block'
            _file = null
        }
    })

    // 监听用户选择文件的操作
    upload_input.addEventListener('change', function() {
        // 获取用户选择的文件
        console.log(upload_input.files, '???')
        let file = upload_input.files[0]
        /**
         * + name 文件名
         * + size 文件大小 B字节
         * + type 文件类型
         */
        if (!file) return
        // 方案1: 限制文件上传的格式
        if (!/(png|jpg|jpeg)/i.test(file.type)) {
            alert('上传文件格式不正确')
        }
        // 限制文件上传的大小
        if(file.size > 2 * 1024 * 1024) {
            alert('上传文件不能超过2MB')
            return
        }
        upload_tip.style.display = 'none'
        upload_list.innerHTML = `
            <li>
                <span>文件: ${file.name}</span>
                <span><em>移除</em></span>
            </li>
        `
        _file = file
        // console.log(file)
        // 事件委托,依托事件冒泡机制
    })

    // 点击文件选择按钮,触发上传文件的行为
    upload_button_select.addEventListener('click', function() {
        upload_input.click();
    })

    // 点击上传文件到服务器
    upload_button_upload.addEventListener('click', function() {
        console.log(_file)
        if(!_file) {
            return alert('请您先选择上传的文件')
        }

        // 将文件传给服务器 FormData / base64
        let formData = new FormData();
        formData.append('file', _file)
        formData.append('filename', _file.name)
        instance.post('/upload_single', formData).then(res => {
            const { code } = res;
            if (code === 0) {
                alert('file 上传成功')
                return
            }
            console.log(res)
            return Promise.reject(data.codeText)
        }).catch( e => {
            console.log(e)
        })
    })
})()