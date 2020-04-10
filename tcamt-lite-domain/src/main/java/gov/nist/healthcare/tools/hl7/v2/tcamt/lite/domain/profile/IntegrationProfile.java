package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

import java.util.HashSet;
import java.util.Set;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


@Document(collection = "integration-profile")
public class IntegrationProfile implements java.io.Serializable{

  /**
   * 
   */
  private static final long serialVersionUID = 7134030777465774150L;

  public IntegrationProfile() {
    super();
    this.id = new ObjectId().toString();
  }
  
  @Id
  private String id;
  
  private IntegrationProfileMetaData integrationProfileMetaData;
  
  private Set<Datatype> datatypes;

  private Set<Segment> segments;

  private Set<ConformanceProfile> conformanceProfiles;

  public Set<Datatype> getDatatypes() {
    return datatypes;
  }

  public void setDatatypes(Set<Datatype> datatypes) {
    this.datatypes = datatypes;
  }
  
  public void addDatatype(Datatype dt){
    if(this.datatypes == null) this.datatypes = new HashSet<Datatype>();
    this.datatypes.add(dt);
  }

  public Set<Segment> getSegments() {
    return segments;
  }

  public void setSegments(Set<Segment> segments) {
    this.segments = segments;
  }
  
  public void addSegment(Segment s){
    if(this.segments == null) this.segments = new HashSet<Segment>();
    this.segments.add(s);
  }

  public Set<ConformanceProfile> getConformanceProfiles() {
    return conformanceProfiles;
  }

  public void setConformanceProfiles(Set<ConformanceProfile> conformanceProfiles) {
    this.conformanceProfiles = conformanceProfiles;
  }
  
  public void addConformanceProfile(ConformanceProfile cp){
    if(this.conformanceProfiles == null) this.conformanceProfiles = new HashSet<ConformanceProfile>();
    this.conformanceProfiles.add(cp);
  }

  public IntegrationProfileMetaData getIntegrationProfileMetaData() {
    return integrationProfileMetaData;
  }

  public void setIntegrationProfileMetaData(IntegrationProfileMetaData integrationProfileMetaData) {
    this.integrationProfileMetaData = integrationProfileMetaData;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }
  
  public ConformanceProfile findConformanceProfileById(String id) {
    for(ConformanceProfile cp:this.conformanceProfiles) {
      if(cp.getConformanceProfileMetaData().getId().equals(id)) return cp;
    }
    return null;
  }
  
  public Segment findSegemntById(String id) {
    for(Segment s:this.segments) {
      if(s.getId().equals(id)) return s;
    }
    return null;
  }
  
  public Datatype findDatatypeById(String id) {
    for(Datatype dt:this.datatypes) {
      if(dt.getId().equals(id)) return dt;
    }
    return null;
  }
}
