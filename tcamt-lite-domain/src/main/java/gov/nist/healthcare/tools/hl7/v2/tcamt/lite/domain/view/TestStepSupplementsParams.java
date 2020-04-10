package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view;

import java.util.HashMap;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Categorization;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.FieldOrderIndifferentInfo;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.OrderIndifferentInfo;

public class TestStepSupplementsParams extends TestStepXMLParams {
  private String testCaseName;
  private String tdsXSL;
  private String jdXSL;

  private HashMap<String, Categorization> testDataCategorizationMap;
  private HashMap<String, OrderIndifferentInfo> orderIndifferentInfoMap;
  private HashMap<String, FieldOrderIndifferentInfo> fieldOrderIndifferentInfoMap;

  public String getTestCaseName() {
    return testCaseName;
  }

  public void setTestCaseName(String testCaseName) {
    this.testCaseName = testCaseName;
  }

  public String getTdsXSL() {
    return tdsXSL;
  }

  public void setTdsXSL(String tdsXSL) {
    this.tdsXSL = tdsXSL;
  }

  public String getJdXSL() {
    return jdXSL;
  }

  public void setJdXSL(String jdXSL) {
    this.jdXSL = jdXSL;
  }

  public HashMap<String, Categorization> getTestDataCategorizationMap() {
    return testDataCategorizationMap;
  }

  public void setTestDataCategorizationMap(HashMap<String, Categorization> testDataCategorizationMap) {
    this.testDataCategorizationMap = testDataCategorizationMap;
  }

  @Override
  public String toString() {
    return "TestStepSupplementsParams [testCaseName=" + testCaseName + ", tdsXSL=" + tdsXSL
        + ", jdXSL=" + jdXSL + ", testDataCategorizationMap=" + testDataCategorizationMap
        + ", getIntegrationProfileId()=" + getIntegrationProfileId()
        + ", getConformanceProfileId()=" + getConformanceProfileId() + ", getEr7Message()="
        + getEr7Message() + "]";
  }

  public HashMap<String, OrderIndifferentInfo> getOrderIndifferentInfoMap() {
    return orderIndifferentInfoMap;
  }

  public void setOrderIndifferentInfoMap(HashMap<String, OrderIndifferentInfo> orderIndifferentInfoMap) {
    this.orderIndifferentInfoMap = orderIndifferentInfoMap;
  }

  public HashMap<String, FieldOrderIndifferentInfo> getFieldOrderIndifferentInfoMap() {
    return fieldOrderIndifferentInfoMap;
  }

  public void setFieldOrderIndifferentInfoMap(HashMap<String, FieldOrderIndifferentInfo> fieldOrderIndifferentInfoMap) {
    this.fieldOrderIndifferentInfoMap = fieldOrderIndifferentInfoMap;
  }
  
  
}
