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

import java.util.ArrayList;
import java.util.List;

/**
 * @author jungyubw
 *
 */
public class ConformanceProfile {  
  private ConformanceProfileMetaData conformanceProfileMetaData;

  private List<SegmentRefOrGroup> children;

  public ConformanceProfileMetaData getConformanceProfileMetaData() {
    return conformanceProfileMetaData;
  }

  public void setConformanceProfileMetaData(ConformanceProfileMetaData conformanceProfileMetaData) {
    this.conformanceProfileMetaData = conformanceProfileMetaData;
  }

  public List<SegmentRefOrGroup> getChildren() {
    return children;
  }

  public void setChildren(List<SegmentRefOrGroup> children) {
    this.children = children;
  }
  
  public void addChild(SegmentRefOrGroup seog){
    if(this.children == null) this.children = new ArrayList<SegmentRefOrGroup>();
    this.children.add(seog);
  }

}
