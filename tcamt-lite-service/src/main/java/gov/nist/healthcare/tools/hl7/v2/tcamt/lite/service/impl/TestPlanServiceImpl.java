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

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo.TestPlanRepository;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanClone;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanSaveException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanService;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mongodb.MongoException;

@Service
public class TestPlanServiceImpl implements TestPlanService {
	Logger log = LoggerFactory.getLogger(TestPlanServiceImpl.class);
	@Autowired
	private TestPlanRepository testplanRepository;

	@Override
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public TestPlan save(TestPlan tp) throws TestPlanException {
		try {
			DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
			tp.setLastUpdateDate(dateFormat.format(Calendar.getInstance().getTime()));
			return testplanRepository.save(tp);
		} catch (MongoException e) {
			throw new TestPlanException(e);
		}
	}
	
	@Override
	@Transactional
	public void delete(String id) {
		testplanRepository.delete(id);
	}

	@Override
	public TestPlan findOne(String id) {
		TestPlan tp = testplanRepository.findOne(id);
		return tp;
	}
	

	@Override
	public List<TestPlan> findAll() {
		List<TestPlan> testplans = testplanRepository.findAll();
		log.info("testplans=" + testplans.size());
		return testplans;
	}
	

	@Override
	public List<TestPlan> findByAccountId(Long accountId) {
		List<TestPlan> testplans = testplanRepository.findByAccountId(accountId);
		// if (profiles != null && !profiles.isEmpty()) {
		// for (Profile profile : profiles) {
		// processChildren(profile);
		// }
		// }
		log.debug("User Test Plan found=" + testplans.size());
		return testplans;
	}

	@Override
	public TestPlan clone(TestPlan tp) throws CloneNotSupportedException {
		return new TestPlanClone().clone(tp);
	}

	@Override
	public TestPlan apply(TestPlan tp) throws TestPlanSaveException {
		DateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd HH:mm:ss");
		tp.setLastUpdateDate(dateFormat.format(Calendar.getInstance().getTime()));
		testplanRepository.save(tp);
		return tp;
	}
}
