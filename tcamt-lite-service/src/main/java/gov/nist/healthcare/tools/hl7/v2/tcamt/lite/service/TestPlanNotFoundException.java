package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service;

public class TestPlanNotFoundException extends Exception {
	private static final long serialVersionUID = 1L;

	public TestPlanNotFoundException(String id) {
		super("Unknown IGDocument with id " + id);
	}

	public TestPlanNotFoundException(Exception error) {
		super(error);
	}

}
