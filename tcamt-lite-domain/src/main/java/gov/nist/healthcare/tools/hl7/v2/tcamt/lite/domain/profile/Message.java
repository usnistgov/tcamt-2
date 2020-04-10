package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.Id;

import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "message")
public class Message implements Serializable, Cloneable {

	/**
	 * 
	 */
	private static final long serialVersionUID = -5059047349842226726L;
	@Id
	private long id;

	private String name;

	private String description;

	private String lastUpdateDate;

	private String version;

	private String hl7EndcodedMessage;

	private String conformanceProfile;

	private Long accountId;

	private Set<Constraint> tcamtConstraints = new HashSet<Constraint>();

	public Message() {
		this.tcamtConstraints = new HashSet<Constraint>();
	}

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

	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}

	@Override
	public Message clone() throws CloneNotSupportedException {
		Message cloned = (Message) super.clone();
		cloned.setId(0);
		Set<Constraint> cTcamtConstraints = new HashSet<Constraint>();
		for (Constraint c : this.tcamtConstraints) {
			cTcamtConstraints.add(c.clone());
		}
		cloned.setTcamtConstraints(cTcamtConstraints);
		return cloned;
	}

	public String getHl7EndcodedMessage() {
		return hl7EndcodedMessage;
	}

	public void setHl7EndcodedMessage(String hl7EndcodedMessage) {
		this.hl7EndcodedMessage = hl7EndcodedMessage;
	}

	public Set<Constraint> getTcamtConstraints() {
		return tcamtConstraints;
	}

	public void setTcamtConstraints(Set<Constraint> tcamtConstraints) {
		this.tcamtConstraints = tcamtConstraints;
	}

	public void addTCAMTConstraint(Constraint tcamtConstraint) {
		this.tcamtConstraints.add(tcamtConstraint);
	}

	public void deleteTCAMTConstraintByIPath(String iPath) {
		for (Constraint c : this.getTcamtConstraints()) {
			if (c.getIpath().equals(iPath)) {
				this.getTcamtConstraints().remove(c);
				return;
			}
		}
	}

	public Constraint findTCAMTConstraintByIPath(String iPath) {
		for (Constraint c : this.getTcamtConstraints()) {
			if (c.getIpath().equals(iPath)) {
				return c;
			}
		}

		return new Constraint();
	}

	public String getLastUpdateDate() {
		return lastUpdateDate;
	}

	public void setLastUpdateDate(String lastUpdateDate) {
		this.lastUpdateDate = lastUpdateDate;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getConformanceProfile() {
		return conformanceProfile;
	}

	public void setConformanceProfile(String conformanceProfile) {
		this.conformanceProfile = conformanceProfile;
	}

	public Long getAccountId() {
		return accountId;
	}

	public void setAccountId(Long accountId) {
		this.accountId = accountId;
	}

}
