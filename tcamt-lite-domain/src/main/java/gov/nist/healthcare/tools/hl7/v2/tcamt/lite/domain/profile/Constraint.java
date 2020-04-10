package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.persistence.Id;

public class Constraint implements Serializable, Cloneable{

	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1204577056373564913L;

	@Id
	private long id;
	
	private String messageName;
	private String usageList;
	private String ipath;
	private String iPosition;
	private String comments;
	private String level;
	private String categorization;
	private String data;
	private String assertionScript;
	
	
	public Constraint(String messageName, String usageList, String ipath, String iPosition, String comments,
			String level, String categorization, String data,
			String assertionScript) {
		super();
		this.messageName = messageName;
		this.usageList = usageList;
		this.iPosition = iPosition;
		this.ipath = ipath;
		this.comments = comments;
		this.level = level;
		this.categorization = categorization;
		this.data = data;
		this.assertionScript = assertionScript;
	}
	
	public Constraint(){
		super();
	}

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public String getIpath() {
		return ipath;
	}

	public void setIpath(String ipath) {
		this.ipath = ipath;
	}

	public String getComments() {
		return comments;
	}

	public void setComments(String comments) {
		this.comments = comments;
	}

	public String getLevel() {
		return level;
	}

	public void setLevel(String level) {
		this.level = level;
	}

	public String getCategorization() {
		return categorization;
	}

	public void setCategorization(String categorization) {
		this.categorization = categorization;
	}

	public String getData() {
		return data;
	}

	public void setData(String data) {
		this.data = data;
	}

	public String getAssertionScript() {
		return assertionScript;
	}

	public void setAssertionScript(String assertionScript) {
		this.assertionScript = assertionScript;
	}
	
	@Override
	public Constraint clone() throws CloneNotSupportedException {
		Constraint cTCAMTConstraint = (Constraint)super.clone();
		cTCAMTConstraint.setId(0);
		return cTCAMTConstraint;
	}

	public String getMessageName() {
		return messageName;
	}

	public void setMessageName(String messageName) {
		this.messageName = messageName;
	}

	public String getUsageList() {
		return usageList;
	}

	public void setUsageList(String usageList) {
		this.usageList = usageList;
	}

	public String getiPosition() {
		return iPosition;
	}

	public void setiPosition(String iPosition) {
		this.iPosition = iPosition;
	}

	@Override
	public String toString() {
		return "TCAMTConstraint [id=" + id + ", messageName=" + messageName
				+ ", usageList=" + usageList + ", ipath=" + ipath
				+ ", iPosition=" + iPosition + ", comments=" + comments
				+ ", level=" + level + ", categorization=" + categorization
				+ ", data=" + data + ", assertionScript=" + assertionScript
				+ "]";
	}

	public List<String> getListData() {
		if(this.data == null || data.equals("")) return new ArrayList<String>();
		
		if(this.data.contains("','")) return new ArrayList<String>(Arrays.asList(this.data.substring(1, this.data.length()-1).split("','")));
		else {
			List<String> listData = new ArrayList<String>();
			listData.add(this.data);
			
			return listData;
		}
	}
}
