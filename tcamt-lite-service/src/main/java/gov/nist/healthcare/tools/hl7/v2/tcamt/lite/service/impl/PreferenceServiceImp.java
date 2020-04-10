package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Preference;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo.PreferenceRepository;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo.TestStoryConfigurationRepository;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.PreferenceService;
@Service

public class PreferenceServiceImp implements PreferenceService {
	@Autowired
	private PreferenceRepository preferenceRepository;

	@Override
	public Preference save(Preference config) {
		// TODO Auto-generated method stub
		return preferenceRepository.save(config);
	}

	@Override
	public List<Preference> findByAccountId(Long accountId) {
		return preferenceRepository.findByAccountId(accountId);

	}

	@Override
	public Preference findById(String id) {
		// TODO Auto-generated method stub
		return preferenceRepository.findById(id);
	}

}
