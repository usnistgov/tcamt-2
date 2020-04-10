package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal;

import java.util.ArrayList;
import java.util.List;


public class SegmentNode {

  private String segmentStr;
  private String segmentName;
  private String segmentId;
  private String iPath;
  private String iPositionPath;
  private String path;
  private String postionPath;

  private List<FieldNode> children;

  public void addChild(FieldNode n) {
    if (this.children == null)
      this.children = new ArrayList<FieldNode>();
    this.children.add(n);
  }

  public String getSegmentStr() {
    return segmentStr;
  }

  public void setSegmentStr(String segmentStr) {
    this.segmentStr = segmentStr;
  }

  public String getSegmentId() {
    return segmentId;
  }

  public void setSegmentId(String segmentId) {
    this.segmentId = segmentId;
  }

  public String getiPath() {
    return iPath;
  }

  public void setiPath(String iPath) {
    this.iPath = iPath;
  }

  public List<FieldNode> getChildren() {
    return children;
  }

  public void setChildren(List<FieldNode> children) {
    this.children = children;
  }

  public String getiPositionPath() {
    return iPositionPath;
  }

  public void setiPositionPath(String iPositionPath) {
    this.iPositionPath = iPositionPath;
  }

  public String getPath() {
    return path;
  }

  public void setPath(String path) {
    this.path = path;
  }

  public String getPostionPath() {
    return postionPath;
  }

  public void setPostionPath(String postionPath) {
    this.postionPath = postionPath;
  }

  public String getSegmentName() {
    return segmentName;
  }

  public void setSegmentName(String segmentName) {
    this.segmentName = segmentName;
  }

}
