package org.example.imageresizespringboot.order;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "customer_orders")
public class OrderEntity {
    @Id private String orderId;
    private String customerName; private String email; private String packageName; private String addons;
    private BigDecimal subtotal; private BigDecimal tax; private BigDecimal discount; private BigDecimal total;
    private String status; private Instant createdAt;
    protected OrderEntity() { }
    public OrderEntity(String id, String name, String email, String packageName, String addons, BigDecimal subtotal, BigDecimal tax, BigDecimal discount, BigDecimal total) {
        this.orderId=id; this.customerName=name; this.email=email; this.packageName=packageName; this.addons=addons; this.subtotal=subtotal; this.tax=tax; this.discount=discount; this.total=total; this.status="completed"; this.createdAt=Instant.now();
    }
    public String getOrderId(){return orderId;} public String getCustomerName(){return customerName;} public String getEmail(){return email;} public String getPackageName(){return packageName;} public String getAddons(){return addons;} public BigDecimal getSubtotal(){return subtotal;} public BigDecimal getTax(){return tax;} public BigDecimal getDiscount(){return discount;} public BigDecimal getTotal(){return total;} public String getStatus(){return status;} public Instant getCreatedAt(){return createdAt;}
}
