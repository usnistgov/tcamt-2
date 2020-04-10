package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.exception;

public class GVTLoginException extends Exception {
  private static final long serialVersionUID = 1L;

  public GVTLoginException() {
    super();
  }

  public GVTLoginException(String error) {
    super(error);
  }

  public GVTLoginException(Exception error) {
    super(error);
  }

}
