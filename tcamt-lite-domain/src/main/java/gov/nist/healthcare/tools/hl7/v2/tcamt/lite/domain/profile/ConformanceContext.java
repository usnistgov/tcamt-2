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

import java.util.Set;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * @author jungyubw
 *
 */

@Document(collection = "conformance-context")
public class ConformanceContext implements java.io.Serializable{

  /**
   * 
   */
  private static final long serialVersionUID = -6137855295572071416L;

  @Id
  private String id;
  
  private ConformanceContextMetaData metaData;

  private Set<Predicate> datatypePredicates;
  private Set<Predicate> segmentPredicates;
  private Set<Predicate> groupPredicates;
  private Set<Predicate> messagePredicates;

  private Set<ConformanceStatement> datatypeConformanceStatements;
  private Set<ConformanceStatement> segmentConformanceStatements;
  private Set<ConformanceStatement> groupConformanceStatements;
  private Set<ConformanceStatement> messageConformanceStatements;
  
  public ConformanceContext() {
    super();
    this.id = new ObjectId().toString();
  }

  public ConformanceContextMetaData getMetaData() {
    return metaData;
  }

  public void setMetaData(ConformanceContextMetaData metaData) {
    this.metaData = metaData;
  }

  public Set<Predicate> getDatatypePredicates() {
    return datatypePredicates;
  }

  public void setDatatypePredicates(Set<Predicate> datatypePredicates) {
    this.datatypePredicates = datatypePredicates;
  }

  public Set<Predicate> getSegmentPredicates() {
    return segmentPredicates;
  }

  public void setSegmentPredicates(Set<Predicate> segmentPredicates) {
    this.segmentPredicates = segmentPredicates;
  }

  public Set<Predicate> getGroupPredicates() {
    return groupPredicates;
  }

  public void setGroupPredicates(Set<Predicate> groupPredicates) {
    this.groupPredicates = groupPredicates;
  }

  public Set<Predicate> getMessagePredicates() {
    return messagePredicates;
  }

  public void setMessagePredicates(Set<Predicate> messagePredicates) {
    this.messagePredicates = messagePredicates;
  }

  public Set<ConformanceStatement> getDatatypeConformanceStatements() {
    return datatypeConformanceStatements;
  }

  public void setDatatypeConformanceStatements(
      Set<ConformanceStatement> datatypeConformanceStatements) {
    this.datatypeConformanceStatements = datatypeConformanceStatements;
  }

  public Set<ConformanceStatement> getSegmentConformanceStatements() {
    return segmentConformanceStatements;
  }

  public void setSegmentConformanceStatements(
      Set<ConformanceStatement> segmentConformanceStatements) {
    this.segmentConformanceStatements = segmentConformanceStatements;
  }

  public Set<ConformanceStatement> getGroupConformanceStatements() {
    return groupConformanceStatements;
  }

  public void setGroupConformanceStatements(Set<ConformanceStatement> groupConformanceStatements) {
    this.groupConformanceStatements = groupConformanceStatements;
  }

  public Set<ConformanceStatement> getMessageConformanceStatements() {
    return messageConformanceStatements;
  }

  public void setMessageConformanceStatements(
      Set<ConformanceStatement> messageConformanceStatements) {
    this.messageConformanceStatements = messageConformanceStatements;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }


}
