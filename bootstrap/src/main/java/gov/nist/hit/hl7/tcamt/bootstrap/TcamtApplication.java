package gov.nist.hit.hl7.tcamt.bootstrap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;

import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Properties;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@SpringBootApplication
@EnableAutoConfiguration(exclude = {DataSourceAutoConfiguration.class,
    DataSourceTransactionManagerAutoConfiguration.class, HibernateJpaAutoConfiguration.class})
@EnableMongoRepositories("gov.nist.hit.hl7.tcamt")
@ComponentScan({"gov.nist.hit.hl7.tcamt", "gov.nist.hit.hl7.auth.util.crypto", "gov.nist.hit.hl7.auth.util.service"})
public class TcamtApplication {

    private static final String EMAIL_PORT = "email.port";
    private static final String EMAIL_PROTOCOL = "email.protocol";
    private static final String EMAIL_HOST = "email.host";
    // private static final String EMAIL_ADMIN = "email.admin";
    private static final String EMAIL_FROM = "email.from";
    private static final String EMAIL_SUBJECT = "email.subject";
    // private static final String EMAIL_SMTP_AUTH = "email.smtp.auth";
    // private static final String EMAIL_DEBUG = "email.debug";

    @Autowired
    Environment env;

	public static void main(String[] args) {
		SpringApplication.run(TcamtApplication.class, args);
	}

    @Bean
    public JavaMailSenderImpl mailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(env.getProperty(EMAIL_HOST));
        mailSender.setPort(Integer.valueOf(env.getProperty(EMAIL_PORT)));
        mailSender.setProtocol(env.getProperty(EMAIL_PROTOCOL));
        Properties javaMailProperties = new Properties();
        //    javaMailProperties.setProperty("email.smtp.auth", env.getProperty(EMAIL_SMTP_AUTH));
        //    javaMailProperties.setProperty("mail.debug", env.getProperty(EMAIL_DEBUG));

        mailSender.setJavaMailProperties(javaMailProperties);
        return mailSender;
    }

    @Bean
    public org.springframework.mail.SimpleMailMessage templateMessage() {
        org.springframework.mail.SimpleMailMessage templateMessage =
            new org.springframework.mail.SimpleMailMessage();
        templateMessage.setFrom(env.getProperty(EMAIL_FROM));
        templateMessage.setSubject(env.getProperty(EMAIL_SUBJECT));
        return templateMessage;
    }
}
