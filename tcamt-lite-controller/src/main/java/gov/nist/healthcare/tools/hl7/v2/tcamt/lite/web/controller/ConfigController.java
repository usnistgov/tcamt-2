package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.nht.acmgt.dto.ResponseMessage;
import gov.nist.healthcare.nht.acmgt.dto.domain.Account;
import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStoryConfiguration;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestStoryConfigurationService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.OperationNotAllowException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.UserAccountNotFoundException;

@RestController
@RequestMapping("/config")
public class ConfigController extends CommonController {
  @Autowired
  UserService userService;

  @Autowired
  TestStoryConfigurationService testStoryConfigurationService;

  @Autowired
  AccountRepository accountRepository;

  @RequestMapping(method = RequestMethod.GET, produces = "application/json")
  public List<TestStoryConfiguration> getAllTestStoryConfigurations() throws Exception {
    try {
      User u = userService.getCurrentUser();
      Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
      if (account == null) {
        throw new UserAccountNotFoundException();
      }
      return testStoryConfigurationService.findByAccountId(account.getId());
    } catch (Exception e) {
      throw new Exception(e);
    }
  }

  @RequestMapping(value = "/save", method = RequestMethod.POST)
  public void save(@RequestBody TestStoryConfiguration tsc) throws Exception {
    try {
      User u = userService.getCurrentUser();
      Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
      if (account == null)
        throw new UserAccountNotFoundException();
      testStoryConfigurationService.save(tsc);
    } catch (Exception e) {
      throw new Exception(e);
    }
  }


  @RequestMapping(value = "/{id}/delete", method = RequestMethod.POST)
  public ResponseMessage delete(@PathVariable("id") String id) throws Exception {
    try {
      User u = userService.getCurrentUser();
      Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
      if (account == null)
        throw new UserAccountNotFoundException();
      TestStoryConfiguration testStoryConfiguration = testStoryConfigurationService.findById(id);
      if (testStoryConfiguration.getAccountId() == account.getId()) {
        testStoryConfigurationService.delete(id);
        return new ResponseMessage(ResponseMessage.Type.success,
            "TestStoryConfigurationDeletedSuccess", null);
      } else {
        throw new OperationNotAllowException("delete");
      }
    } catch (RuntimeException e) {
      throw new Exception(e);
    } catch (Exception e) {
      throw new Exception(e);
    }
  }
}
