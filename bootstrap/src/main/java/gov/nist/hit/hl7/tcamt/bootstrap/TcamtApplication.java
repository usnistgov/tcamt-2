package gov.nist.hit.hl7.tcamt.bootstrap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@EnableMongoRepositories("gov.nist.hit.hl7.tcamt")
@ComponentScan({"gov.nist.hit.hl7.tcamt", "gov.nist.hit.hl7.auth.util.crypto","gov.nist.hit.hl7.auth.util.service"})
public class TcamtApplication {

	public static void main(String[] args) {
		SpringApplication.run(TcamtApplication.class, args);
	}
}
