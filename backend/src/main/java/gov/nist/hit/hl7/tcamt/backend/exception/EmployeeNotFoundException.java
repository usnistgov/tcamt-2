package gov.nist.hit.hl7.tcamt.backend.exception;

public class EmployeeNotFoundException extends RuntimeException {

	private static final long serialVersionUID = -8821216040254539581L;

	public EmployeeNotFoundException(String id) {
		super("Could not find employee " + id);
	}
}
