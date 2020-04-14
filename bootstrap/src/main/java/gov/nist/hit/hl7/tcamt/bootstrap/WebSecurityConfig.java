package gov.nist.hit.hl7.tcamt.bootstrap;

// import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
// import org.springframework.security.core.userdetails.User;
// import org.springframework.security.core.userdetails.UserDetails;
// import org.springframework.security.core.userdetails.UserDetailsService;
// import org.springframework.security.provisioning.InMemoryUserDetailsManager;

import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import gov.nist.hit.hl7.tcamt.auth.client.config.JWTAuthenticationFilter;


@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private JWTAuthenticationFilter authFilter;

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {


    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        // TODO Auto-generated method stub
        http.
            csrf().disable()
            .authorizeRequests()
                .antMatchers("/api/login").permitAll()
                .antMatchers("/api/register").permitAll()
                .antMatchers("/api/password/**").permitAll()
                .antMatchers("/api/config/**").permitAll()
                .antMatchers("/api/documentations/getAll").permitAll()
                .antMatchers("/api/storage/file").permitAll()
                /*
				.antMatchers("/people/**").permitAll()
				.antMatchers("/employees/**").permitAll()
				.antMatchers("/orders/**").permitAll()
                */
                .antMatchers("/api/**").fullyAuthenticated()
                .antMatchers("/**").fullyAuthenticated()
                .and()
            .addFilterBefore(authFilter, UsernamePasswordAuthenticationFilter.class);
    }

    /*
	@Override
	protected void configure(HttpSecurity http) throws Exception {
		http
            .csrf().disable()
// FIXME : for test
            .httpBasic()
                .and()
			.authorizeRequests()
				.antMatchers("/", "/home").permitAll()
				.antMatchers("/people/**").permitAll()
				.antMatchers("/employees/**").permitAll()
				.antMatchers("/orders/**").permitAll()
				.anyRequest().authenticated()
				.and()
			.formLogin()
				.loginPage("/login")
				.permitAll()
				.and()
			.logout()
				.permitAll();
	}

    // FIXME : for-test
    // Create 2 users for demo
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {

        auth.inMemoryAuthentication()
                .withUser("user").password("{noop}password").roles("USER")
                .and()
                .withUser("admin").password("{noop}password").roles("USER", "ADMIN");

    }
    */

    // FIXME : for-test
    /* for UserDetailed service
	@Bean
	@Override
	public UserDetailsService userDetailsService() {
		UserDetails user =
			 User.withDefaultPasswordEncoder()
				.username("user")
				.password("password")
				.roles("USER")
				.build();

		return new InMemoryUserDetailsManager(user);
	}
    */
}
