package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;
public class PushRBException extends Exception {
	private static final long serialVersionUID = 1L;

	public PushRBException(String error) {
		super(error);
	}

	public PushRBException(Exception error) {
		super(error);
	}
}