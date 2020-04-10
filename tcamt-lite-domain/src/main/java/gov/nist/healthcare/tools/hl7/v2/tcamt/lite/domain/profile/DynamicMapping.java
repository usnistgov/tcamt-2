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
public class DynamicMapping {

  private DynamicMappingDef dynamicMappingDef;
  private List<DynamicMappingItem> items;

  public void addItem(DynamicMappingItem item) {
    if (this.items == null)
      this.items = new ArrayList<DynamicMappingItem>();
    this.items.add(item);
  }

  public DynamicMappingDef getDynamicMappingDef() {
    return dynamicMappingDef;
  }

  public void setDynamicMappingDef(DynamicMappingDef dynamicMappingDef) {
    this.dynamicMappingDef = dynamicMappingDef;
  }

  public List<DynamicMappingItem> getItems() {
    return items;
  }

  public void setItems(List<DynamicMappingItem> items) {
    this.items = items;
  }
  
  public String findDataypteIdByReferences(String firstRef, String secondRef){
    if(firstRef != null && secondRef == null){
      for(DynamicMappingItem item:this.items){
        if(item.getValue() != null && item.getValue().equals(firstRef) && item.getSecondValue() == null){
          return item.getDatatypeId();
        }
      }
    }else if(firstRef != null && secondRef != null){
      for(DynamicMappingItem item:this.items){
        if(item.getValue() != null && item.getSecondValue() != null && item.getValue().equals(firstRef) && item.getSecondValue().equals(secondRef)){
          return item.getDatatypeId();
        }
      }
      
      return findDataypteIdByReferences(firstRef, null);
    }
    return null;
  }
}
