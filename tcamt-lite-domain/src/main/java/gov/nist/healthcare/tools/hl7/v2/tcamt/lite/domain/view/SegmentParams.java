package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view;

import java.util.HashMap;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Categorization;

public class SegmentParams {

  private String integrationProfileId;
  private String conformanceProfileId;
  private String lineStr;
  private String segmentId;
  private String iPath;
  private String iPositionPath;
  private String path;
  private String positionPath;
  private String usagePath;
  private HashMap<String, Categorization> testDataCategorizationMap;

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

  public String getLineStr() {
    return lineStr;
  }

  public void setLineStr(String lineStr) {
    this.lineStr = lineStr;
  }

  public String getSegmentId() {
    return segmentId;
  }

  public void setSegmentId(String segmentId) {
    this.segmentId = segmentId;
  }

  public String getiPath() {
    return iPath;
  }

  public void setiPath(String iPath) {
    this.iPath = iPath;
  }

  public String getiPositionPath() {
    return iPositionPath;
  }

  public void setiPositionPath(String iPositionPath) {
    this.iPositionPath = iPositionPath;
  }

  public String getPath() {
    return path;
  }

  public void setPath(String path) {
    this.path = path;
  }

  public String getUsagePath() {
    return usagePath;
  }

  public void setUsagePath(String usagePath) {
    this.usagePath = usagePath;
  }

  public HashMap<String, Categorization> getTestDataCategorizationMap() {
    return testDataCategorizationMap;
  }

  public void setTestDataCategorizationMap(HashMap<String, Categorization> testDataCategorizationMap) {
    this.testDataCategorizationMap = testDataCategorizationMap;
  }

  public String getPositionPath() {
    return positionPath;
  }

  public void setPositionPath(String positionPath) {
    this.positionPath = positionPath;
  }



}
