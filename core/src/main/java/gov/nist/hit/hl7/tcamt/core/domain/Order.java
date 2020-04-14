package gov.nist.hit.hl7.tcamt.core.domain;

import org.springframework.data.annotation.Id;

public class Order {

	@Id
	public String id;

	private String description;
	private Status status;

	Order() {}

	public Order(String description, Status status) {

		this.description = description;
		this.status = status;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Status getStatus() {
		return status;
	}

	public void setStatus(Status status) {
		this.status = status;
	}
}
