package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception;

public class TestPlanException extends Exception {
	private static final long serialVersionUID = 1L;

	public TestPlanException(String error) {
		super(error);
	}

	public TestPlanException(Exception error) {
		super(error);
	}

}
