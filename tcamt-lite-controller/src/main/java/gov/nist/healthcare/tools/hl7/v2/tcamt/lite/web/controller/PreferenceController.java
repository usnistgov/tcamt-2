package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.nht.acmgt.dto.domain.Account;
import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Preference;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.PreferenceService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.UserAccountNotFoundException;


@RestController
@RequestMapping("/prefs")
public class PreferenceController {
	
	Logger log = LoggerFactory.getLogger(TemplateController.class);

	@Autowired
	private PreferenceService preferenceService;

	@Autowired
	UserService userService;

	@Autowired
	AccountRepository accountRepository;
	
	
	@RequestMapping(value = "/find", method = RequestMethod.GET)
	public Preference get(){	
	    try {
	        User u = userService.getCurrentUser();
	        Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
	        if (account == null) {
	          throw new UserAccountNotFoundException();
	        }
			List<Preference> p= preferenceService.findByAccountId(account.getId());
			if(!p.isEmpty()){
				return p.get(0);
			}else{
				return new Preference();
			}	
	      } catch (RuntimeException e) {
				return new Preference();

	      } catch (Exception e) {
				return new Preference();

	      }
	}
	
	@RequestMapping(value = "/save", method = RequestMethod.POST)
	public Preference save(@RequestBody Preference p){
	    try {
	        User u = userService.getCurrentUser();
	        Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
	        if (account == null) {
	          throw new UserAccountNotFoundException();
	        }
	        
		p.setAccountId(account.getId());
	
		return  preferenceService.save(p);
	    } catch (RuntimeException e) {
	    	return p;
      } catch (Exception e) {
            return p;
      }

	}

}
