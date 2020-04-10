package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

public class Component {

  private String name;
  
  private Usage usage;
  
  private String datatypeId;
  
  private Integer minLength;
  
  private String maxLength;
  
  private String bindingId;
  
  private BindingStrength bindingStrength;
  
  private String bindingLocation;
  
  private boolean hide;
  
  public Component() {
    super();
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Usage getUsage() {
    return usage;
  }

  public void setUsage(Usage usage) {
    this.usage = usage;
  }

  public String getDatatypeId() {
    return datatypeId;
  }

  public void setDatatypeId(String datatypeId) {
    this.datatypeId = datatypeId;
  }

  public String getBindingId() {
    return bindingId;
  }

  public void setBindingId(String bindingId) {
    this.bindingId = bindingId;
  }

  public BindingStrength getBindingStrength() {
    return bindingStrength;
  }

  public void setBindingStrength(BindingStrength bindingStrength) {
    this.bindingStrength = bindingStrength;
  }

  public String getMaxLength() {
    return maxLength;
  }

  public void setMaxLength(String maxLength) {
    this.maxLength = maxLength;
  }

  public Integer getMinLength() {
    return minLength;
  }

  public void setMinLength(Integer minLength) {
    this.minLength = minLength;
  }

  public String getBindingLocation() {
    return bindingLocation;
  }

  public void setBindingLocation(String bindingLocation) {
    this.bindingLocation = bindingLocation;
  }

  public boolean isHide() {
    return hide;
  }

  public void setHide(boolean hide) {
    this.hide = hide;
  }

  
}
