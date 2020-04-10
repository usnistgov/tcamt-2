package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

public class GrandProfile {

  private String id;

  private String profileXMLStr;
  private String valueSetXMLStr;
  private String constraintXMLStr;

  public String getProfileXMLStr() {
    return profileXMLStr;
  }

  public void setProfileXMLStr(String profileXMLStr) {
    this.profileXMLStr = profileXMLStr;
  }

  public String getValueSetXMLStr() {
    return valueSetXMLStr;
  }

  public void setValueSetXMLStr(String valueSetXMLStr) {
    this.valueSetXMLStr = valueSetXMLStr;
  }

  public String getConstraintXMLStr() {
    return constraintXMLStr;
  }

  public void setConstraintXMLStr(String constraintXMLStr) {
    this.constraintXMLStr = constraintXMLStr;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }


}
