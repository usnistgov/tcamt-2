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

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * @author jungyubw
 *
 */
@Document(collection = "valueset-library")
public class ValueSetLibrary implements java.io.Serializable{

  /**
   * 
   */
  private static final long serialVersionUID = 2977735380027633233L;

  @Id
  private String id;
  
  private ValueSetLibraryMetaData metaData;
  private Set<String> noValidationSet;
  private Set<ValueSetDefinition> valueSetDefinitions;

  public ValueSetLibrary() {
    super();
    this.id = new ObjectId().toString();
  }

  public ValueSetLibraryMetaData getMetaData() {
    return metaData;
  }

  public void setMetaData(ValueSetLibraryMetaData metaData) {
    this.metaData = metaData;
  }

  public Set<String> getNoValidationSet() {
    return noValidationSet;
  }

  public void setNoValidationSet(Set<String> noValidationSet) {
    this.noValidationSet = noValidationSet;
  }
  
  public void addNoValidation(String id) {
    if(this.noValidationSet == null) this.noValidationSet = new HashSet<String>();
    this.noValidationSet.add(id);
  }

  public Set<ValueSetDefinition> getValueSetDefinitions() {
    return valueSetDefinitions;
  }

  public void setValueSetDefinitions(Set<ValueSetDefinition> valueSetDefinitions) {
    this.valueSetDefinitions = valueSetDefinitions;
  }
  
  public void addValueSetDefinition(ValueSetDefinition valueSetDefinition) {
    if(this.valueSetDefinitions == null) this.valueSetDefinitions = new HashSet<ValueSetDefinition>();
    this.valueSetDefinitions.add(valueSetDefinition);
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }



}
