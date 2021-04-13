package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view;

public class TestStepXMLParams extends TestStepParams {
  private String testCaseName;

  public String getTestCaseName() {
    return testCaseName;
  }

  public void setTestCaseName(String testCaseName) {
    this.testCaseName = testCaseName;
  }

@Override
public String toString() {
	return "TestStepXMLParams [testCaseName=" + testCaseName + "]";
}
  
  
}
