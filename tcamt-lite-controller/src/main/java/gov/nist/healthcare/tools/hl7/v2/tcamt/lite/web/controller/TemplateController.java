package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

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
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Template;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TemplateService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanListException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.UserAccountNotFoundException;

@RestController
@RequestMapping("/template")
public class TemplateController extends CommonController {

	Logger log = LoggerFactory.getLogger(TemplateController.class);

	@Autowired
	private TemplateService templateService;

	@Autowired
	UserService userService;

	@Autowired
	AccountRepository accountRepository;


	/**
	 * 
	 * @param type
	 * @return
	 * @throws UserAccountNotFoundException
	 * @throws TestPlanException
	 */
	@RequestMapping(method = RequestMethod.GET, produces = "application/json")
	public Template getTemplate() throws UserAccountNotFoundException, TestPlanListException {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null) {
				throw new UserAccountNotFoundException();
			}
			return templateService.findByAccountId(account.getId());
		} catch (RuntimeException e) {
			throw new TestPlanListException(e);
		} catch (Exception e) {
			throw new TestPlanListException(e);
		}
	}


	@RequestMapping(value = "/save", method = RequestMethod.POST)
	public Template save(@RequestBody Template t) throws Exception {
		try {
			User u = userService.getCurrentUser();
			Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
			if (account == null) throw new UserAccountNotFoundException();
			return templateService.save(t);
		} catch (Exception e) {
			throw e;
		}
	}

}
