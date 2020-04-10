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
package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

/**
 * @author jungyubw
 *
 */
public class Field {
  private String name;

  private Usage usage;

  private String datatypeId;

  private Integer min;

  private String max;

  private Integer minLength;

  private String maxLength;

  private String bindingId;

  private BindingStrength bindingStrength;

  private String bindingLocation;
  
  private boolean hide;

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

  public Integer getMin() {
    return min;
  }

  public void setMin(Integer min) {
    this.min = min;
  }

  public String getMax() {
    return max;
  }

  public void setMax(String max) {
    this.max = max;
  }

  public Integer getMinLength() {
    return minLength;
  }

  public void setMinLength(Integer minLength) {
    this.minLength = minLength;
  }

  public String getMaxLength() {
    return maxLength;
  }

  public void setMaxLength(String maxLength) {
    this.maxLength = maxLength;
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
