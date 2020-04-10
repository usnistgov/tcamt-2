/**
 * This software was developed at the National Institute of Standards and Technology by employees of
 * the Federal Government in the course of their official duties. Pursuant to title 17 Section 105
 * of the United States Code this software is not subject to copyright protection and is in the
 * public domain. This is an experimental system. NIST assumes no responsibility whatsoever for its
 * use by other parties, and makes no guarantees, expressed or implied, about its quality,
 * reliability, or any other characteristic. We would appreciate acknowledgement if the software is
 * used. This software can be redistributed and/or modified freely provided that any derivative
 * works bear some notice that they are derived from it, and any modified versions bear some notice
 * that they have been modified.
 */
package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view;

import java.util.HashMap;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Categorization;

/**
 * @author jungyubw
 *
 */
public class ConstraintParams {

  private String integrationProfileId;
  private String conformanceProfileId;
  private String er7Message;
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

  public String getEr7Message() {
    return er7Message;
  }

  public void setEr7Message(String er7Message) {
    this.er7Message = er7Message;
  }

  public HashMap<String, Categorization> getTestDataCategorizationMap() {
    return testDataCategorizationMap;
  }

  public void setTestDataCategorizationMap(
      HashMap<String, Categorization> testDataCategorizationMap) {
    this.testDataCategorizationMap = testDataCategorizationMap;
  }

  @Override
  public String toString() {
    return "ConstraintParams [integrationProfileId=" + integrationProfileId
        + ", conformanceProfileId=" + conformanceProfileId + ", er7Message=" + er7Message
        + ", testDataCategorizationMap=" + testDataCategorizationMap + "]";
  }


}
