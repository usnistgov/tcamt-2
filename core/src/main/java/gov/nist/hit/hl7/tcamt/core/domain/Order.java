package gov.nist.hit.hl7.tcamt.core.domain;

import lombok.Data;

import org.springframework.data.annotation.Id;

@Data
public class Order {

	@Id public String id;

	private String description;
	private Status status;

	Order() {}

	public Order(String description, Status status) {

		this.description = description;
		this.status = status;
	}
}
