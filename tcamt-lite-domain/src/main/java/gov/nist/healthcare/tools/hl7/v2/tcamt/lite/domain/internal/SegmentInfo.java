package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Segment;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Usage;

public class SegmentInfo {

  private String name;
  private String positionPath;
  private String path;
  private String iPositionPath;
  private String iPath;

  private boolean anchor;
  private Usage usage;
  private String usagePath;

  private String max;
  
  private Segment segment;


  @Override
  public String toString() {
    return "SegmentInfo [name=" + name + ", positionPath=" + positionPath + ", path=" + path
        + ", iPositionPath=" + iPositionPath + ", iPath=" + iPath + ", anchor=" + anchor
        + ", usage=" + usage + ", usagePath=" + usagePath + ", max=" + max + ", segment=" + segment
        + "]";
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getPositionPath() {
    return positionPath;
  }

  public void setPositionPath(String positionPath) {
    this.positionPath = positionPath;
  }

  public String getPath() {
    return path;
  }

  public void setPath(String path) {
    this.path = path;
  }

  public String getiPositionPath() {
    return iPositionPath;
  }

  public void setiPositionPath(String iPositionPath) {
    this.iPositionPath = iPositionPath;
  }

  public String getiPath() {
    return iPath;
  }

  public void setiPath(String iPath) {
    this.iPath = iPath;
  }

  public boolean isAnchor() {
    return anchor;
  }

  public void setAnchor(boolean anchor) {
    this.anchor = anchor;
  }

  public Usage getUsage() {
    return usage;
  }

  public void setUsage(Usage usage) {
    this.usage = usage;
  }

  public String getUsagePath() {
    return usagePath;
  }

  public void setUsagePath(String usagePath) {
    this.usagePath = usagePath;
  }

  public String getMax() {
    return max;
  }

  public void setMax(String max) {
    this.max = max;
  }

  public Segment getSegment() {
    return segment;
  }

  public void setSegment(Segment segment) {
    this.segment = segment;
  }


}
