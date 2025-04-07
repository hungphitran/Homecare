// Thêm vào file helpers.js
const isWaitPayment = (status) => {
    return status === 'waitPayment';
};

module.exports = {
    isWaitPayment
};