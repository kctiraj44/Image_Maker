package org.example.imageresizespringboot.order;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OrderService {
    private final OrderRepository repository;

    public OrderService(OrderRepository repository) {
        this.repository = repository;
    }

    public List<OrderResponse> getAll() {
        return repository.findAll().stream().map(OrderResponse::from).toList();
    }

    public OrderResponse create(OrderRequest request) {
        OrderEntity order = new OrderEntity(
                request.orderId(), request.customerName(), request.email(), request.packageName(),
                String.join(",", request.addons()), request.subtotal(), request.tax(), request.discount(), request.total());
        return OrderResponse.from(repository.save(order));
    }

    public void delete(String orderId) {
        repository.deleteById(orderId);
    }

    public void deleteAll() {
        repository.deleteAll();
    }
}
