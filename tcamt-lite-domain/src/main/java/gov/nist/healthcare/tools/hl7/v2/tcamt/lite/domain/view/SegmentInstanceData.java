package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Segment;

public class SegmentInstanceData {

  private int lineNum;
  private String segmentName;
  private String positionPath;
  private String positionIPath;
  private String path;
  private String iPath;
  private String usagePath;
  private String lineStr;
  
  private Segment segmentDef;
  
  
  

  @Override
  public String toString() {
    return "SegmentInstanceData [lineNum=" + lineNum + ", segmentName=" + segmentName
        + ", positionPath=" + positionPath + ", positionIPath=" + positionIPath + ", path=" + path
        + ", iPath=" + iPath + ", usagePath=" + usagePath + ", lineStr=" + lineStr + ", segmentDef="
        + segmentDef + "]";
  }

  public String getSegmentName() {
    return segmentName;
  }

  public void setSegmentName(String segmentName) {
    this.segmentName = segmentName;
  }

  public String getPositionPath() {
    return positionPath;
  }

  public void setPositionPath(String positionPath) {
    this.positionPath = positionPath;
  }

  public String getPositionIPath() {
    return positionIPath;
  }

  public void setPositionIPath(String positionIPath) {
    this.positionIPath = positionIPath;
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

  public String getUsagePath() {
    return usagePath;
  }

  public void setUsagePath(String usagePath) {
    this.usagePath = usagePath;
  }

  public String getLineStr() {
    return lineStr;
  }

  public void setLineStr(String lineStr) {
    this.lineStr = lineStr;
  }

  public int getLineNum() {
    return lineNum;
  }

  public void setLineNum(int lineNum) {
    this.lineNum = lineNum;
  }

  public Segment getSegmentDef() {
    return segmentDef;
  }

  public void setSegmentDef(Segment segmentDef) {
    this.segmentDef = segmentDef;
  }



}
