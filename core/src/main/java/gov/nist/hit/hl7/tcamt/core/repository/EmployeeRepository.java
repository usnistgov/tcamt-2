package gov.nist.hit.hl7.tcamt.core.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import gov.nist.hit.hl7.tcamt.core.domain.*;

public interface EmployeeRepository extends MongoRepository<Employee, String> {

}
