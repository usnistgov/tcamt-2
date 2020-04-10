package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;

import javax.persistence.Id;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "actor")
public class Actor implements Serializable, Cloneable {
	
	/**
	 * 
	 */
	private static final long serialVersionUID = -7055167312186642563L;

	@Id
	private long id;
	
	private String name;
	
	private String role;
	
	private String reference;
	
	private Integer version;
	
	private Long accountId;

	public long getId() {
		return id;
	}

	public void setId(long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public String getReference() {
		return reference;
	}

	public void setReference(String reference) {
		this.reference = reference;
	}

	public Integer getVersion() {
		return version;
	}

	public void setVersion(Integer version) {
		this.version = version;
	}

	@Override
	public Actor clone() throws CloneNotSupportedException {
		Actor cloned = (Actor) super.clone();
		return cloned;
	}

	public Long getAccountId() {
		return accountId;
	}

	public void setAccountId(Long accountId) {
		this.accountId = accountId;
	}

}
