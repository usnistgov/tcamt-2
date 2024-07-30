package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

public class GrandProfile {

	private String id;

	private String profileXMLStr;
	private String valueSetXMLStr;
	private String constraintXMLStr;
	private String slicingXMLFileStr;
	private String bindingXMLFileStr;
	private String coconstraintsXMLFileStr;

	public void setCoconstraintsXMLFileStr(String coconstraintsXMLFileStr) {
		this.coconstraintsXMLFileStr = coconstraintsXMLFileStr;
	}

	public String getProfileXMLStr() {
		return profileXMLStr;
	}

	public void setProfileXMLStr(String profileXMLStr) {
		this.profileXMLStr = profileXMLStr;
	}

	public String getValueSetXMLStr() {
		return valueSetXMLStr;
	}

	public void setValueSetXMLStr(String valueSetXMLStr) {
		this.valueSetXMLStr = valueSetXMLStr;
	}

	public String getConstraintXMLStr() {
		return constraintXMLStr;
	}

	public void setConstraintXMLStr(String constraintXMLStr) {
		this.constraintXMLStr = constraintXMLStr;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getSlicingXMLFileStr() {
		return slicingXMLFileStr;
	}

	public void setSlicingXMLFileStr(String slicingXMLFileStr) {
		this.slicingXMLFileStr = slicingXMLFileStr;
	}

	public String getBindingXMLFileStr() {
		return bindingXMLFileStr;
	}

	public void setBindingXMLFileStr(String bindingXMLFileStr) {
		this.bindingXMLFileStr = bindingXMLFileStr;
	}

	public String getCoconstraintsXMLFileStr() {
		return coconstraintsXMLFileStr;
	}



}
