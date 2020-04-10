package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view;

public class TestStepParams {

  private String integrationProfileId;
  private String conformanceProfileId;
  private String er7Message;

  public String getIntegrationProfileId() {
    return integrationProfileId;
  }

  public void setIntegrationProfileId(String integrationProfileId) {
    this.integrationProfileId = integrationProfileId;
  }

  public String getConformanceProfileId() {
    return conformanceProfileId;
  }

  public void setConformanceProfileId(String conformanceProfileId) {
    this.conformanceProfileId = conformanceProfileId;
  }

  public String getEr7Message() {
    return er7Message;
  }

  public void setEr7Message(String er7Message) {
    this.er7Message = er7Message;
  }


}
