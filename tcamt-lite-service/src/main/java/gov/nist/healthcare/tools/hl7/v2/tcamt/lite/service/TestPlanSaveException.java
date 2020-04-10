package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.util.TestPlanPropertySaveError;

import java.util.List;

public class TestPlanSaveException extends Exception {
	private static final long serialVersionUID = 1L;

	private List<TestPlanPropertySaveError> errors = null;

	public TestPlanSaveException(String error) {
		super(error);
	} 
	
	public TestPlanSaveException(Exception error) {
		super(error);
	}
	

	public TestPlanSaveException(List<TestPlanPropertySaveError> errors) {
		super();
		this.errors = errors;
	}

	public List<TestPlanPropertySaveError> getErrors() {
		return errors;
	}

	public void setErrors(List<TestPlanPropertySaveError> errors) {
		this.errors = errors;
	}

}
