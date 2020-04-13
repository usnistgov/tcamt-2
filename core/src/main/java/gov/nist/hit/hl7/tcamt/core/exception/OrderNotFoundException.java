package gov.nist.hit.hl7.tcamt.core.exception;

public class OrderNotFoundException extends RuntimeException {

	private static final long serialVersionUID = -4589267264910330648L;

	public OrderNotFoundException(String id) {
		super("Could not find order " + id);
	}
}
