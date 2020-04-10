package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.util.Set;

public class GrandTestPlan {
  private TestPlan testplan;
  private Set<GrandProfile> grandProfiles;

  public TestPlan getTestplan() {
    return testplan;
  }

  public void setTestplan(TestPlan testplan) {
    this.testplan = testplan;
  }

  public Set<GrandProfile> getGrandProfiles() {
    return grandProfiles;
  }

  public void setGrandProfiles(Set<GrandProfile> grandProfiles) {
    this.grandProfiles = grandProfiles;
  }


}
