package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

import java.util.Date;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "profiledata")
public class ProfileData implements java.io.Serializable{
  /**
   * 
   */
  private static final long serialVersionUID = -1936198766473594071L;

  @Id
  private String id;
  
  private Long accountId;
  
  private String sourceType;
  
  private Date lastUpdatedDate;

  private IntegrationProfile integrationProfile;
  
  private ConformanceContext conformanceContext;
  
  private ValueSetLibrary valueSetLibrary;

  private String profileXMLFileStr;
  private String valueSetXMLFileStr;
  private String constraintsXMLFileStr;
  
  private String slicingXMLFileStr;
  private String bindingXMLFileStr;
  private String coconstraintsXMLFileStr;

  public String getProfileXMLFileStr() {
    return profileXMLFileStr;
  }

  public void setProfileXMLFileStr(String profileXMLFileStr) {
    this.profileXMLFileStr = profileXMLFileStr;
  }

  public String getValueSetXMLFileStr() {
    return valueSetXMLFileStr;
  }

  public void setValueSetXMLFileStr(String valueSetXMLFileStr) {
    this.valueSetXMLFileStr = valueSetXMLFileStr;
  }

  public String getConstraintsXMLFileStr() {
    return constraintsXMLFileStr;
  }

  public void setConstraintsXMLFileStr(String constraintsXMLFileStr) {
    this.constraintsXMLFileStr = constraintsXMLFileStr;
  }
  
  public Long getAccountId() {
    return accountId;
  }

  public void setAccountId(Long accountId) {
    this.accountId = accountId;
  }

  public String getSourceType() {
    return sourceType;
  }

  public void setSourceType(String sourceType) {
    this.sourceType = sourceType;
  }

  public Date getLastUpdatedDate() {
    return lastUpdatedDate;
  }

  public void setLastUpdatedDate(Date lastUpdatedDate) {
    this.lastUpdatedDate = lastUpdatedDate;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public IntegrationProfile getIntegrationProfile() {
    return integrationProfile;
  }

  public void setIntegrationProfile(IntegrationProfile integrationProfile) {
    this.integrationProfile = integrationProfile;
  }

  public ConformanceContext getConformanceContext() {
    return conformanceContext;
  }

  public void setConformanceContext(ConformanceContext conformanceContext) {
    this.conformanceContext = conformanceContext;
  }

  public ValueSetLibrary getValueSetLibrary() {
    return valueSetLibrary;
  }

  public void setValueSetLibrary(ValueSetLibrary valueSetLibrary) {
    this.valueSetLibrary = valueSetLibrary;
  }

public String getBindingXMLFileStr() {
	return bindingXMLFileStr;
}

public void setBindingXMLFileStr(String bindingXMLFileStr) {
	this.bindingXMLFileStr = bindingXMLFileStr;
}

public String getSlicingXMLFileStr() {
	return slicingXMLFileStr;
}

public void setSlicingXMLFileStr(String slicingXMLFileStr) {
	this.slicingXMLFileStr = slicingXMLFileStr;
}

public String getCoconstraintsXMLFileStr() {
	return coconstraintsXMLFileStr;
}

public void setCoconstraintsXMLFileStr(String coconstraintsXMLFileStr) {
	this.coconstraintsXMLFileStr = coconstraintsXMLFileStr;
}
  
  
}
