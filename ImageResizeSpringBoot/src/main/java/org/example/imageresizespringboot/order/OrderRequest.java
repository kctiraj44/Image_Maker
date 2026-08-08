package org.example.imageresizespringboot.order;
import java.math.BigDecimal;
import java.util.List;
public record OrderRequest(String orderId, String customerName, String email, String packageName, List<String> addons, BigDecimal subtotal, BigDecimal tax, BigDecimal discount, BigDecimal total) { }
