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

import java.util.HashSet;
import java.util.Set;

/**
 * @author jungyubw
 *
 */
public class ValueSetDefinition {
  private String bindingIdentifier;
  private String name;
  private String group;
  private Integer order;

  private Set<ValueElement> children;

  public String getBindingIdentifier() {
    return bindingIdentifier;
  }

  public void setBindingIdentifier(String bindingIdentifier) {
    this.bindingIdentifier = bindingIdentifier;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getGroup() {
    return group;
  }

  public void setGroup(String group) {
    this.group = group;
  }

  public Integer getOrder() {
    return order;
  }

  public void setOrder(Integer order) {
    this.order = order;
  }

  public Set<ValueElement> getChildren() {
    return children;
  }

  public void setChildren(Set<ValueElement> children) {
    this.children = children;
  }

  public void addValueElement(ValueElement ve) {
    if(this.children == null) this.children = new HashSet<ValueElement>();
    this.children.add(ve);
  }
}
