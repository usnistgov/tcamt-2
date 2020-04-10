package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.HashMap;

public class ConstraintXMLOutPut {
  private HashMap<String, String> categorizationsDataMap = new HashMap<String, String>();
  private HashMap<String, String> categorizationsUsageMap = new HashMap<String, String>();
  private String xmlStr;

  public HashMap<String, String> getCategorizationsDataMap() {
    return categorizationsDataMap;
  }

  public void setCategorizationsDataMap(HashMap<String, String> categorizationsDataMap) {
    this.categorizationsDataMap = categorizationsDataMap;
  }

  public HashMap<String, String> getCategorizationsUsageMap() {
    return categorizationsUsageMap;
  }

  public void setCategorizationsUsageMap(HashMap<String, String> categorizationsUsageMap) {
    this.categorizationsUsageMap = categorizationsUsageMap;
  }

  public String getXmlStr() {
    return xmlStr;
  }

  public void setXmlStr(String xmlStr) {
    this.xmlStr = xmlStr;
  }


}
