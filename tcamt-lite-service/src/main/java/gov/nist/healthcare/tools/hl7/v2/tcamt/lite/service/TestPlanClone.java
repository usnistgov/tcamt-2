package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;

import org.springframework.stereotype.Service;

@Service
public class TestPlanClone {
	public TestPlan clone(TestPlan original) throws CloneNotSupportedException {
		return original.clone();

	}
}
