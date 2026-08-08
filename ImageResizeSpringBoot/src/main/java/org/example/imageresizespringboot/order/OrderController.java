package org.example.imageresizespringboot.order;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "${app.cors.allowed-origin}")
public class OrderController {
    private final OrderService service;
    public OrderController(OrderService service) { this.service = service; }
    @GetMapping public List<OrderResponse> getAll() { return service.getAll(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@RequestBody OrderRequest request) {
        return service.create(request);
    }
    @DeleteMapping("/{orderId}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable String orderId) { service.delete(orderId); }
    @DeleteMapping @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteAll() { service.deleteAll(); }
}
