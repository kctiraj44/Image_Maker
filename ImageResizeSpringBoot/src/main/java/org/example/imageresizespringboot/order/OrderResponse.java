package org.example.imageresizespringboot.order;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderResponse(
        String orderId,
        String customerName,
        String email,
        String packageName,
        String addons,
        BigDecimal subtotal,
        BigDecimal tax,
        BigDecimal discount,
        BigDecimal total,
        String status,
        Instant createdAt) {

    static OrderResponse from(OrderEntity order) {
        return new OrderResponse(
                order.getOrderId(), order.getCustomerName(), order.getEmail(), order.getPackageName(),
                order.getAddons(), order.getSubtotal(), order.getTax(), order.getDiscount(), order.getTotal(),
                order.getStatus(), order.getCreatedAt());
    }
}
