package gov.nist.hit.hl7.tcamt.core.exception;

public class OrderNotFoundException extends RuntimeException {

	public OrderNotFoundException(String id) {
		super("Could not find order " + id);
	}
}
