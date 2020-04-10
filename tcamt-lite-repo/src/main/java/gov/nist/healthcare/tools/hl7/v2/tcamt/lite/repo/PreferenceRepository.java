package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Preference;

public interface PreferenceRepository extends MongoRepository<Preference, String> {
	 List<Preference> findByAccountId(Long accountId);
	 Preference findById(String id);

}
