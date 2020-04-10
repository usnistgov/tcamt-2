package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service;

import java.util.List;

import org.springframework.stereotype.Service;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Preference;
@Service
public interface PreferenceService {
	public Preference save(Preference config);

	public List<Preference> findByAccountId(Long accountId);
	
	public Preference findById(String id);
}
