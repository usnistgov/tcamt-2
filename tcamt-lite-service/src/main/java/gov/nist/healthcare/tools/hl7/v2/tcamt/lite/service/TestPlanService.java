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
 * @author Jungyub Woo
 * 
 */

package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public interface TestPlanService {
	
	public TestPlan save(TestPlan tp) throws TestPlanException;

	public void delete(String id);

	public TestPlan findOne(String id);

	public List<TestPlan> findAll();

	public List<TestPlan> findByAccountId(Long accountId);

	public TestPlan clone(TestPlan tp) throws CloneNotSupportedException;

	public TestPlan apply(TestPlan tp) throws TestPlanSaveException;
}
