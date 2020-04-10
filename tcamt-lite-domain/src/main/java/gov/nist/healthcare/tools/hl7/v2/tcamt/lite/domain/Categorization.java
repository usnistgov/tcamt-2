package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.util.ArrayList;
import java.util.List;

public class Categorization {

	private String iPath;
	private String name;
	private List<String> listData = new ArrayList<String>();
	private String testDataCategorization;
	
	
	public String getiPath() {
		return iPath;
	}
	public void setiPath(String iPath) {
		this.iPath = iPath;
	}
	public String getTestDataCategorization() {
		return testDataCategorization;
	}
	public void setTestDataCategorization(String testDataCategorization) {
		this.testDataCategorization = testDataCategorization;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public List<String> getListData() {
		return listData;
	}
	public void setListData(List<String> listData) {
		this.listData = listData;
	}
}
