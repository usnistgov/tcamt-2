package gov.nist.hit.hl7.tcamt.backend.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import gov.nist.hit.hl7.tcamt.backend.domain.*;

public interface EmployeeRepository extends MongoRepository<Employee, String> {

}
