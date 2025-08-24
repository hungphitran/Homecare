const firebaseService = require('../services/firebaseService');

// Example usage in your existing controllers
class OrderNotificationHelper {
  
  // Gửi thông báo khi đơn hàng được tạo
  static async notifyOrderCreated(customerPhone, orderData) {
    try {
      await firebaseService.sendOrderNotification(customerPhone, {
        orderId: orderData.orderId,
        status: 'created',
        title: 'Đơn hàng đã được tạo',
        message: `Đơn hàng ${orderData.orderId} đã được tạo thành công. Chúng tôi sẽ sớm xác nhận đơn hàng của bạn.`,
        extraData: {
          totalAmount: orderData.totalAmount,
          serviceType: orderData.serviceType
        }
      });
    } catch (error) {
      console.error('Error sending order created notification:', error);
    }
  }

  // Gửi thông báo khi đơn hàng được xác nhận
  static async notifyOrderConfirmed(customerPhone, orderData) {
    try {
      await firebaseService.sendOrderNotification(customerPhone, {
        orderId: orderData.orderId,
        status: 'confirmed',
        title: 'Đơn hàng đã được xác nhận',
        message: `Đơn hàng ${orderData.orderId} đã được xác nhận. Helper sẽ đến làm việc vào ${orderData.scheduledTime}.`,
        extraData: {
          helperName: orderData.helperName,
          helperPhone: orderData.helperPhone,
          scheduledTime: orderData.scheduledTime
        }
      });
    } catch (error) {
      console.error('Error sending order confirmed notification:', error);
    }
  }

  // Gửi thông báo khi helper đang trên đường đến
  static async notifyHelperOnWay(customerPhone, orderData) {
    try {
      await firebaseService.sendOrderNotification(customerPhone, {
        orderId: orderData.orderId,
        status: 'helper_onway',
        title: 'Helper đang trên đường đến',
        message: `${orderData.helperName} đang trên đường đến địa chỉ của bạn. Dự kiến đến trong ${orderData.estimatedArrival} phút.`,
        extraData: {
          helperName: orderData.helperName,
          helperPhone: orderData.helperPhone,
          estimatedArrival: orderData.estimatedArrival
        }
      });
    } catch (error) {
      console.error('Error sending helper on way notification:', error);
    }
  }

  // Gửi thông báo khi helper đã đến
  static async notifyHelperArrived(customerPhone, orderData) {
    try {
      await firebaseService.sendOrderNotification(customerPhone, {
        orderId: orderData.orderId,
        status: 'helper_arrived',
        title: 'Helper đã đến',
        message: `${orderData.helperName} đã đến địa chỉ của bạn. Vui lòng liên hệ nếu cần hỗ trợ.`,
        extraData: {
          helperName: orderData.helperName,
          helperPhone: orderData.helperPhone
        }
      });
    } catch (error) {
      console.error('Error sending helper arrived notification:', error);
    }
  }

  // Gửi thông báo khi công việc bắt đầu
  static async notifyWorkStarted(customerPhone, orderData) {
    try {
      await firebaseService.sendOrderNotification(customerPhone, {
        orderId: orderData.orderId,
        status: 'work_started',
        title: 'Công việc đã bắt đầu',
        message: `Helper ${orderData.helperName} đã bắt đầu thực hiện công việc cho đơn hàng ${orderData.orderId}.`,
        extraData: {
          helperName: orderData.helperName,
          startTime: orderData.startTime
        }
      });
    } catch (error) {
      console.error('Error sending work started notification:', error);
    }
  }

  // Gửi thông báo khi công việc hoàn thành
  static async notifyWorkCompleted(customerPhone, orderData) {
    try {
      await firebaseService.sendOrderNotification(customerPhone, {
        orderId: orderData.orderId,
        status: 'completed',
        title: 'Công việc đã hoàn thành',
        message: `Đơn hàng ${orderData.orderId} đã được hoàn thành. Vui lòng đánh giá dịch vụ để giúp chúng tôi cải thiện.`,
        extraData: {
          helperName: orderData.helperName,
          completedTime: orderData.completedTime,
          totalAmount: orderData.totalAmount
        }
      });
    } catch (error) {
      console.error('Error sending work completed notification:', error);
    }
  }

  // Gửi thông báo thanh toán
  static async notifyPaymentDue(customerPhone, orderData) {
    try {
      await firebaseService.sendOrderNotification(customerPhone, {
        orderId: orderData.orderId,
        status: 'payment_due',
        title: 'Thanh toán đơn hàng',
        message: `Vui lòng thanh toán ${orderData.totalAmount}đ cho đơn hàng ${orderData.orderId}.`,
        extraData: {
          totalAmount: orderData.totalAmount,
          paymentMethods: orderData.paymentMethods
        }
      });
    } catch (error) {
      console.error('Error sending payment due notification:', error);
    }
  }

  // Gửi thông báo hủy đơn hàng
  static async notifyOrderCancelled(customerPhone, orderData) {
    try {
      await firebaseService.sendOrderNotification(customerPhone, {
        orderId: orderData.orderId,
        status: 'cancelled',
        title: 'Đơn hàng đã bị hủy',
        message: `Đơn hàng ${orderData.orderId} đã bị hủy. ${orderData.cancelReason || 'Liên hệ hỗ trợ để biết thêm chi tiết.'}`,
        extraData: {
          cancelReason: orderData.cancelReason,
          refundAmount: orderData.refundAmount
        }
      });
    } catch (error) {
      console.error('Error sending order cancelled notification:', error);
    }
  }
}

module.exports = OrderNotificationHelper;
