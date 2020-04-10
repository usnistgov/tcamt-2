package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import javax.persistence.Id;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "teststoryconfig")
public class TestStoryConfiguration implements Serializable {

	/**
	 * 
	 */
	private static final long serialVersionUID = -8394683260177435814L;

	@Id
	private String id;
	private String name;
	private Long accountId;

	private List<TestStroyEntry> testStoryConfig = new ArrayList<TestStroyEntry>();

	public TestStoryConfiguration() {
		super();
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Long getAccountId() {
		return accountId;
	}

	public void setAccountId(Long accountId) {
		this.accountId = accountId;
	}

	public List<TestStroyEntry> getTestStoryConfig() {
		return testStoryConfig;
	}

	public void setTestStoryConfig(List<TestStroyEntry> testStoryConfig) {
		this.testStoryConfig = testStoryConfig;
	}

}
