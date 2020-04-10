package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import javax.persistence.Id;

public class ER7Template {
  @Id
  private String id;

  private String name;
  private String description;
  private String date;

  private String integrationProfileId;
  private String conformanceProfileId;

  private String structID;

  private String er7Message;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getDate() {
    return date;
  }

  public void setDate(String date) {
    this.date = date;
  }

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


  public String getStructID() {
    return structID;
  }

  public void setStructID(String structID) {
    this.structID = structID;
  }



}
