package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

import java.util.ArrayList;
import java.util.List;

public class Datatype implements java.io.Serializable {

  private static final long serialVersionUID = 1L;

  public Datatype() {
    super();
  }

  private String id;

  private String name;

  private String label;

  private String description;

  private List<Component> children;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getLabel() {
    return label;
  }

  public void setLabel(String label) {
    this.label = label;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public List<Component> getChildren() {
    return children;
  }

  public void setChildren(List<Component> children) {
    this.children = children;
  }

  /**
   * @param c
   */
  public void addComponent(Component c) {
    if (this.children == null)
      this.children = new ArrayList<Component>();
    this.children.add(c);

  }

  @Override
  public String toString() {
    return "Datatype [id=" + id + ", name=" + name + ", label=" + label + ", description="
        + description + ", children=" + children + "]";
  }



}
