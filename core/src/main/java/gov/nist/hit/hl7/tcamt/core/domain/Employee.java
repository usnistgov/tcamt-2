package gov.nist.hit.hl7.tcamt.core.domain;

import lombok.Data;

import org.springframework.data.annotation.Id;

@Data
public class Employee {

	@Id private String id;
	private String firstName;
	private String lastName;
	private String role;

	Employee() {}

	public Employee(String firstName, String lastName, String role) {
		this.firstName = firstName;
		this.lastName = lastName;
		this.role = role;
	}

	public String getName() {
		return this.firstName + " " + this.lastName;
	}

	public void setName(String name) {
		String[] parts =name.split(" ");
		this.firstName = parts[0];
		this.lastName = parts[1];
	}
}
