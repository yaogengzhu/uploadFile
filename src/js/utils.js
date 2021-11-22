
/**
 * 生成随机数
 * @returns
 */
const createRandom = () => {
    let ran = Math.random() * new Date()
    return ran.toString(16).replace('.', '')
}