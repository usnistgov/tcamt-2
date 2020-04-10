package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

public enum BindingStrength {

  R, S, U;

  public String value() {
    return name();
  }
  
  public static BindingStrength fromValue(String v) {
    try {
      return !"".equals(v) && v != null ? valueOf(v) : null;
    } catch (IllegalArgumentException e) {
      return null; // ????
    }
  }
}
