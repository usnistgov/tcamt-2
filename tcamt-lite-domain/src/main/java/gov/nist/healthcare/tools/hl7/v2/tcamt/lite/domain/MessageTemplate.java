package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.Id;

public class MessageTemplate {
  @Id
  private String id;

  private String name;
  private String description;
  private String date;

  private String integrationProfileId;
  private String conformanceProfileId;

  private String structID;

  private List<Categorization> categorizations = new ArrayList<Categorization>();

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

  public String getConformanceProfileId() {
    return conformanceProfileId;
  }

  public void setConformanceProfileId(String conformanceProfileId) {
    this.conformanceProfileId = conformanceProfileId;
  }

  public List<Categorization> getCategorizations() {
    return categorizations;
  }

  public void setCategorizations(List<Categorization> categorizations) {
    this.categorizations = categorizations;
  }

  public String getIntegrationProfileId() {
    return integrationProfileId;
  }

  public void setIntegrationProfileId(String integrationProfileId) {
    this.integrationProfileId = integrationProfileId;
  }

  public String getStructID() {
    return structID;
  }

  public void setStructID(String structID) {
    this.structID = structID;
  }


}
