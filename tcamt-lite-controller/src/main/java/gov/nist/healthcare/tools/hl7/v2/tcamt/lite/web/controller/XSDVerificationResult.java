package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

public class XSDVerificationResult {

  private boolean success;
  private Exception e;

  public XSDVerificationResult(boolean success, Exception e) {
    this.success = success;
    this.e = e;
  }

  public boolean isSuccess() {
    return success;
  }

  public void setSuccess(boolean success) {
    this.success = success;
  }

  public Exception getE() {
    return e;
  }

  public void setE(Exception e) {
    this.e = e;
  }

}
