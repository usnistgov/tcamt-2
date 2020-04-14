package gov.nist.hit.hl7.tcamt.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import gov.nist.hit.hl7.tcamt.backend.domain.*;

public interface CustomerRepository extends MongoRepository<Customer, String> {

	public Customer findByFirstName(String firstName);
	public List<Customer> findByLastName(String lastName);

}
