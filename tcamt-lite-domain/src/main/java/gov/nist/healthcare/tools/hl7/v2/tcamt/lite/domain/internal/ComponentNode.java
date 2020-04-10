package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal;

import java.util.ArrayList;
import java.util.List;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Component;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Datatype;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Predicate;

public class ComponentNode {


  private String type;
  private String path;
  private String iPath;
  private String positionPath;
  private String positioniPath;
  private String usagePath;
  private Component component;
  private Datatype dt;
  private String value;
  private List<SubComponentNode> children;
  private String testDataCategorization;
  private List<String> testDataCategorizationListData;
  private Predicate predicate;
  private List<String> bindingIdentifiers;

  public void addChild(SubComponentNode n) {
    if (this.children == null)
      this.children = new ArrayList<SubComponentNode>();
    this.children.add(n);
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getPath() {
    return path;
  }

  public void setPath(String path) {
    this.path = path;
  }

  public String getiPath() {
    return iPath;
  }

  public void setiPath(String iPath) {
    this.iPath = iPath;
  }

  public String getPositionPath() {
    return positionPath;
  }

  public void setPositionPath(String positionPath) {
    this.positionPath = positionPath;
  }

  public String getPositioniPath() {
    return positioniPath;
  }

  public void setPositioniPath(String positioniPath) {
    this.positioniPath = positioniPath;
  }

  public String getUsagePath() {
    return usagePath;
  }

  public void setUsagePath(String usagePath) {
    this.usagePath = usagePath;
  }

  public Component getComponent() {
    return component;
  }

  public void setComponent(Component component) {
    this.component = component;
  }

  public Datatype getDt() {
    return dt;
  }

  public void setDt(Datatype dt) {
    this.dt = dt;
  }

  public String getValue() {
    return value;
  }

  public void setValue(String value) {
    this.value = value;
  }

  public List<SubComponentNode> getChildren() {
    return children;
  }

  public void setChildren(List<SubComponentNode> children) {
    this.children = children;
  }

  public String getTestDataCategorization() {
    return testDataCategorization;
  }

  public void setTestDataCategorization(String testDataCategorization) {
    this.testDataCategorization = testDataCategorization;
  }

  public List<String> getTestDataCategorizationListData() {
    return testDataCategorizationListData;
  }

  public void setTestDataCategorizationListData(List<String> testDataCategorizationListData) {
    this.testDataCategorizationListData = testDataCategorizationListData;
  }

  public Predicate getPredicate() {
    return predicate;
  }

  public void setPredicate(Predicate predicate) {
    this.predicate = predicate;
  }

  public List<String> getBindingIdentifiers() {
    return bindingIdentifiers;
  }

  public void setBindingIdentifiers(List<String> bindingIdentifiers) {
    this.bindingIdentifiers = bindingIdentifiers;
  }

  public void addBindingIdentifier(String bindingId) {
    if(this.bindingIdentifiers == null) this.bindingIdentifiers = new ArrayList<String>();
    this.bindingIdentifiers.add(bindingId);
  }
}
