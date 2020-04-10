package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.Set;

import javax.persistence.Id;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "tcamtDocument")
public class TcamtDocument implements Serializable, Cloneable {

  /**
   * 
   */
  private static final long serialVersionUID = 2818730764705058185L;

  @Id
  private String id;

  private UserGuide userGuide;
  private UserGuide helpGuide;
  
  private Set<GeneralDocument> generalDocuments;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public UserGuide getUserGuide() {
    return userGuide;
  }

  public void setUserGuide(UserGuide userGuide) {
    this.userGuide = userGuide;
  }

  public Set<GeneralDocument> getGeneralDocuments() {
    return generalDocuments;
  }

  public void setGeneralDocuments(Set<GeneralDocument> generalDocuments) {
    this.generalDocuments = generalDocuments;
  }

  public UserGuide getHelpGuide() {
    return helpGuide;
  }

  public void setHelpGuide(UserGuide helpGuide) {
    this.helpGuide = helpGuide;
  }



}
