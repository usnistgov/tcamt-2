package gov.nist.hit.hl7.tcamt.bootstrap;

import lombok.extern.slf4j.Slf4j;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import gov.nist.hit.hl7.tcamt.core.repository.*;
import gov.nist.hit.hl7.tcamt.core.domain.*;

@Configuration
@Slf4j
class TcamtInitializer {

	@Bean
	CommandLineRunner initDatabase(EmployeeRepository employeeRepository,
								   OrderRepository orderRepository) {
		return args -> {
			/*
			employeeRepository.save(new Employee("Bilbo", "Baggins", "burglar"));
			employeeRepository.save(new Employee("Frodo", "Baggins", "thief"));

			employeeRepository.findAll().forEach(employee -> {
				log.info("Preloaded " + employee);
			});

			// tag::order[]
			orderRepository.save(new Order("MacBook Pro", Status.COMPLETED));
			orderRepository.save(new Order("iPhone", Status.IN_PROGRESS));

			orderRepository.findAll().forEach(order -> {
				log.info("Preloaded " + order);
			});
			// end::order[]
			*/
		};
	}
}
