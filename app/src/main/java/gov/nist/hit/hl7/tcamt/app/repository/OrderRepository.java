package gov.nist.hit.hl7.tcamt.app.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import gov.nist.hit.hl7.tcamt.app.domain.*;

public interface OrderRepository extends MongoRepository<Order, String> {

}
