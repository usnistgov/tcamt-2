package gov.nist.hit.hl7.tcamt.auth.client.exception;

public class AuthenticationException extends Exception {

  /**
  * 
  */
  private static final long serialVersionUID = 1L;

  public AuthenticationException() {
    super();
  }

  public AuthenticationException(String error) {
    super(error);
  }

  public AuthenticationException(Exception error) {
    super(error);
  }

}
