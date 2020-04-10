package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

public class DynamicInfo {
  private String dynamicMappingTarget;
  private String dynamicMappingDatatypeId;

  public String getDynamicMappingTarget() {
    return dynamicMappingTarget;
  }

  public void setDynamicMappingTarget(String dynamicMappingTarget) {
    this.dynamicMappingTarget = dynamicMappingTarget;
  }

  public String getDynamicMappingDatatypeId() {
    return dynamicMappingDatatypeId;
  }

  public void setDynamicMappingDatatypeId(String dynamicMappingDatatypeId) {
    this.dynamicMappingDatatypeId = dynamicMappingDatatypeId;
  }
}
