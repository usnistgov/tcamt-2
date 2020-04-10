package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import javax.persistence.Id;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "preference")

public class Preference {
	
	@Id
	private String id;
	private Long accountId;
	private Boolean hideGvtDialg;
	
	
	public Preference() {
		super();
	}
	public Long getAccountId() {
		return accountId;
	}
	public void setAccountId(Long accountId) {
		this.accountId = accountId;
	}
	public Boolean getHideGvtDialg() {
		return hideGvtDialg;
	}
	public void setHideGvtDialg(Boolean hideGvtDialg) {
		this.hideGvtDialg = hideGvtDialg;
	}
	
	
	

}
