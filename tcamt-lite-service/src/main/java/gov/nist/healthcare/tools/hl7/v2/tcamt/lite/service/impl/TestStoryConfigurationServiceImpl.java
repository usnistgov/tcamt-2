/**
 * This software was developed at the National Institute of Standards and Technology by employees
 * of the Federal Government in the course of their official duties. Pursuant to title 17 Section 105 of the
 * United States Code this software is not subject to copyright protection and is in the public domain.
 * This is an experimental system. NIST assumes no responsibility whatsoever for its use by other parties,
 * and makes no guarantees, expressed or implied, about its quality, reliability, or any other characteristic.
 * We would appreciate acknowledgement if the software is used. This software can be redistributed and/or
 * modified freely provided that any derivative works bear some notice that they are derived from it, and any
 * modified versions bear some notice that they have been modified.
 */

/**
 * 
 * @author Olivier MARIE-ROSE
 * 
 */

package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mongodb.MongoException;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStoryConfiguration;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStroyEntry;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo.TestStoryConfigurationRepository;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestStoryConfigurationService;

@Service
public class TestStoryConfigurationServiceImpl implements TestStoryConfigurationService {
	Logger log = LoggerFactory.getLogger(TestStoryConfigurationServiceImpl.class);
	@Autowired
	private TestStoryConfigurationRepository testStoryConfigurationRepository;

	@Override
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public TestStoryConfiguration save(TestStoryConfiguration config) {
		try {
			return testStoryConfigurationRepository.save(config);
		} catch (MongoException e) {
			throw e;
		}
	}

	@Override
	public List<TestStoryConfiguration> findByAccountId(Long accountId) {
		List<TestStoryConfiguration> configs = testStoryConfigurationRepository.findByAccountId(accountId);
		List<TestStoryConfiguration> dConfigs = testStoryConfigurationRepository.findByAccountId((long) 0);

		if (dConfigs == null || dConfigs.size() == 0) {
			TestStoryConfiguration dConfig = createDefaultConfig();
			this.save(dConfig);

			configs.add(dConfig);
		} else {
			configs.add(dConfigs.get(0));
		}

		return configs;
	}
	
	@Override
	public TestStoryConfiguration findById(String id) {
		return testStoryConfigurationRepository.findOne(id);
	}

	private TestStoryConfiguration createDefaultConfig() {
		TestStoryConfiguration defaultConfig = new TestStoryConfiguration();
		defaultConfig.setName("Default");
		defaultConfig.setAccountId((long) 0);
		List<TestStroyEntry> listOfEntry = new ArrayList<TestStroyEntry>();
		listOfEntry.add(new TestStroyEntry("Description",1, "default", "Description", true, true));
		listOfEntry.add(new TestStroyEntry("Comments",2, "default", "Comments", true, false));
		listOfEntry.add(new TestStroyEntry("Pre-condition", 3, "default", "Pre-condition", true, false));
		listOfEntry.add(new TestStroyEntry("Post-Condition", 4, "default", "Post-Condition", true, false));
		listOfEntry.add(new TestStroyEntry("Test Objectives", 5, "default", "Test Objectives", true, true));
		listOfEntry.add(new TestStroyEntry("Evaluation Criteria", 6, "default", "Evaluation Criteria", true, false));
		listOfEntry.add(new TestStroyEntry("Notes", 7, "default", "Notes", true, false));
		defaultConfig.setTestStoryConfig(listOfEntry);

		return defaultConfig;
	}

  /* (non-Javadoc)
   * @see gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestStoryConfigurationService#delete(java.lang.String)
   */
  @Override
  public void delete(String id) {
    testStoryConfigurationRepository.delete(id);
    
  }
}
