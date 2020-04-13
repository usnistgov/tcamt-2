package gov.nist.hit.hl7.tcamt.core.exception;

public class EmployeeNotFoundException extends RuntimeException {

	public EmployeeNotFoundException(String id) {
		super("Could not find employee " + id);
	}
}
