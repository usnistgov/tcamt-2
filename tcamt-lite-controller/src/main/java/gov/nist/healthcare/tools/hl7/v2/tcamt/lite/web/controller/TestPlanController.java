package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.core.userdetails.User;
import org.springframework.util.FileCopyUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

import gov.nist.healthcare.nht.acmgt.dto.ResponseMessage;
import gov.nist.healthcare.nht.acmgt.dto.domain.Account;
import gov.nist.healthcare.nht.acmgt.repo.AccountRepository;
import gov.nist.healthcare.nht.acmgt.service.UserService;
import gov.nist.healthcare.tools.hl7.v2.igamt.lite.domain.IGDocument;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Categorization;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.GrandProfile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.GrandTestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCase;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseOrGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlanAbstract;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlanDataStr;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStep;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ProfileData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo.TestPlanRepository;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanDeleteException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanListException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanNotFoundException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanSaveException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestStoryConfigurationService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.TestPlanSaveResponse;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.config.TestPlanChangeCommand;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.OperationNotAllowException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.UserAccountNotFoundException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.util.ConnectService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.util.ExportUtil;
import gov.nist.hit.resources.deploy.client.SSLHL7v2ResourceClient;
import gov.nist.hit.resources.deploy.model.Domain;
import gov.nist.hit.resources.deploy.model.Payload;
import gov.nist.hit.resources.deploy.model.RegistredGrant;
import gov.nist.hit.resources.deploy.model.ResourceType;
import gov.nist.hit.resources.deploy.model.Scope;

@RestController
@RequestMapping("/testplans")

public class TestPlanController extends CommonController {

  Logger log = LoggerFactory.getLogger(TestPlanController.class);

  @Autowired
  private TestPlanService testPlanService;

  @Autowired
  private TestPlanRepository testPlanRepository;

  @Autowired
  UserService userService;

  @Autowired
  AccountRepository accountRepository;
  
  @Autowired
  private ConnectService gvtService;

  @Autowired
  TestStoryConfigurationService testStoryConfigurationService;

  @Autowired
  ProfileService profileService;
  @Autowired
  private MailSender mailSender;


 
  @Autowired
  private SimpleMailMessage templateMessage;

//  private static String GVT_URL = "https://hit-dev.nist.gov:8099/gvt/";
   private static String GVT_URL = "https://hl7v2.gvt.nist.gov/gvt/";

  /**
   * 
   * @param type
   * @return
   * @throws UserAccountNotFoundException
   * @throws TestPlanException
   */
  @RequestMapping(method = RequestMethod.GET, produces = "application/json")
  public List<TestPlan> getAllTestPlans()
      throws UserAccountNotFoundException, TestPlanListException {
    try {
      User u = userService.getCurrentUser();
      Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
      if (account == null) {
        throw new UserAccountNotFoundException();
      }
      return testPlanService.findByAccountId(account.getId());
    } catch (RuntimeException e) {
      throw new TestPlanListException(e);
    } catch (Exception e) {
      throw new TestPlanListException(e);
    }
  }

  @RequestMapping(value = "/getListTestPlanAbstract", method = RequestMethod.GET)
  public List<TestPlanAbstract> getListTestPlanAbstract()
      throws UserAccountNotFoundException, TestPlanListException {
    try {
      User u = userService.getCurrentUser();
      Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
      if (account == null) {
        throw new UserAccountNotFoundException();
      }
      List<TestPlan> testplans = testPlanService.findByAccountId(account.getId());
      List<TestPlanAbstract> results = new ArrayList<TestPlanAbstract>();
      for (TestPlan tp : testplans) {
        TestPlanAbstract tpa = new TestPlanAbstract();
        tpa.setDescription(tp.getDescription());
        tpa.setId(tp.getId());
        tpa.setLastUpdateDate(tp.getLastUpdateDate());
        tpa.setName(tp.getName());
        tpa.setVersion(tp.getVersion());
        results.add(tpa);
      }

      return results;

    } catch (RuntimeException e) {
      throw new TestPlanListException(e);
    } catch (Exception e) {
      throw new TestPlanListException(e);
    }
  }

  @RequestMapping(value = "/{id}", method = RequestMethod.GET)
  public TestPlan get(@PathVariable("id") String id) throws TestPlanNotFoundException {
    try {
      log.info("Fetching profile with id=" + id);
      User u = userService.getCurrentUser();
      Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
      if (account == null)
        throw new UserAccountNotFoundException();
      TestPlan tp = findTestPlan(id);
      return tp;
    } catch (RuntimeException e) {
      throw new TestPlanNotFoundException(e);
    } catch (Exception e) {
      throw new TestPlanNotFoundException(e);
    }
  }

  @RequestMapping(value = "/{id}/delete", method = RequestMethod.POST)
  public ResponseMessage delete(@PathVariable("id") String id) throws TestPlanDeleteException {
    try {
      User u = userService.getCurrentUser();
      Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
      if (account == null)
        throw new UserAccountNotFoundException();
      log.info("Delete TestPlan with id=" + id);
      testPlanService.delete(id);
      return new ResponseMessage(ResponseMessage.Type.success, "testPlanDeletedSuccess", null);
    } catch (RuntimeException e) {
      throw new TestPlanDeleteException(e);
    } catch (Exception e) {
      throw new TestPlanDeleteException(e);
    }
  }

  @RequestMapping(value = "/{id}/copy", method = RequestMethod.POST)
  public ResponseMessage copy(@PathVariable("id") String id) throws TestPlanDeleteException {
    try {
      User u = userService.getCurrentUser();
      Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
      if (account == null)
        throw new UserAccountNotFoundException();
      TestPlan tp = findTestPlan(id);
      if (tp.getAccountId().equals(account.getId())) {
        testPlanService.save(testPlanService.clone(tp));
        return new ResponseMessage(ResponseMessage.Type.success, "testPlanCSuccess", null);
      } else {
        throw new OperationNotAllowException("clone");
      }
    } catch (RuntimeException e) {
      throw new TestPlanDeleteException(e);
    } catch (Exception e) {
      throw new TestPlanDeleteException(e);
    }
  }

  @RequestMapping(value = "/save", method = RequestMethod.POST)
  public TestPlanSaveResponse save(@RequestBody TestPlanChangeCommand command)
      throws TestPlanSaveException {

    System.out.println("SAVE REQ");
    try {

      User u = userService.getCurrentUser();
      Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
      if (account == null)
        throw new UserAccountNotFoundException();

      TestPlan saved = testPlanService.apply(command.getTp());
      return new TestPlanSaveResponse(saved.getLastUpdateDate(), saved.getVersion());
    } catch (RuntimeException e) {
      throw new TestPlanSaveException(e);
    } catch (Exception e) {
      throw new TestPlanSaveException(e);
    }
  }

  private TestPlan findTestPlan(String testplanId) throws TestPlanNotFoundException {
    TestPlan tp = testPlanService.findOne(testplanId);
    if (tp == null) {
      throw new TestPlanNotFoundException(testplanId);
    }
    return tp;
  }

  @RequestMapping(value = "/{id}/exportTestPackageHTML", method = RequestMethod.POST,
      produces = "text/xml", consumes = "application/x-www-form-urlencoded; charset=UTF-8")
  public void exportTestPackage(@PathVariable("id") String id, HttpServletRequest request,
      HttpServletResponse response) throws Exception {
    TestPlan tp = findTestPlan(id);
    InputStream content = null;
    content =
        new ExportUtil().exportTestPackageAsHtml(tp, testStoryConfigurationService, profileService);
    response.setContentType("text/html");
    response.setHeader("Content-disposition", "attachment;filename=" + escapeSpace(tp.getName())
        + "-" + new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()) + "_TestPackage.html");
    FileCopyUtils.copy(content, response.getOutputStream());

  }

  @RequestMapping(value = "/{id}/exportRBZip", method = RequestMethod.POST, produces = "text/xml",
      consumes = "application/x-www-form-urlencoded; charset=UTF-8")
  public void exportResourceBundleZip(@PathVariable("id") String id, HttpServletRequest request,
      HttpServletResponse response) throws Exception {
    log.info("Exporting as zip file RB with id=" + id);
    TestPlan tp = findTestPlan(id);
    InputStream content = null;
    content = new ExportUtil().exportResourceBundleAsZip(tp, testStoryConfigurationService,
        profileService);
    response.setContentType("application/zip");
    response.setHeader("Content-disposition", "attachment;filename=" + "resources.zip");
    FileCopyUtils.copy(content, response.getOutputStream());

  }

//  @RequestMapping(value = "/connect/{testplanId}", method = RequestMethod.POST,
//      produces = "application/json")
//  public void pushRB(@PathVariable("testplanId") String testplanId,
//    
//    @RequestHeader("gvt-auth") String authorization,@RequestHeader("target-url") String host,@RequestHeader("target-domain") String domain, HttpServletRequest request)
//      throws Exception {
//
//    User u = userService.getCurrentUser();
//    Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
//
//    SSLHL7v2ResourceClient client = new SSLHL7v2ResourceClient(host, authorization);
//    TestPlan tp = findTestPlan(testplanId);
//    InputStream testPlanIO = null;
//    Set<String> ipidSet = this.findAllProfileIdsInTestPlan(tp);
//
//
//    try {
//      long range = 1234567L;
//      Random r = new Random();
//      Long rand = (long) (r.nextDouble() * range);
//
//      for (String id : ipidSet) {
//        if (id != null && !id.isEmpty()) {
//          InputStream[] xmlArrayIO = new InputStream[3];
//          xmlArrayIO = new ExportUtil().exportProfileXMLArrayZip(id, profileService, rand);
//
////          xmlArrayIO[0].reset();
////          xmlArrayIO[1].reset();
////          xmlArrayIO[2].reset();
////          client.addOrUpdate(new Payload(xmlArrayIO[0]), ResourceType.PROFILE,Scope.USER, domain);
////          client.addOrUpdate(new Payload(xmlArrayIO[1]), ResourceType.VALUE_SET,Scope.USER, domain);
////          client.addOrUpdate(new Payload(xmlArrayIO[2]), ResourceType.CONSTRAINTS,Scope.USER, domain);
//        }
//      }
//
//      testPlanIO = new ExportUtil().exportResourceBundlePushRBAsZip(tp,
//          testStoryConfigurationService, profileService);
////      testPlanIO.reset();
//      client.uploadZip(testPlanIO,domain);
//
//      testPlanRepository.save(tp);
//
//    } catch (Exception e) {
//      e.printStackTrace();
//      throw new PushRBException(e);
//    }
//
//  }
  
  
  
  @RequestMapping(value = "/{id}/connect", method = RequestMethod.POST,
	      produces = "application/json")
	  public Map<String, Object> exportToGVT(@PathVariable("id") String id, @RequestHeader("target-auth") String authorization,@RequestHeader("target-url") String url,@RequestHeader("target-domain") String domain,
	      HttpServletRequest request, HttpServletResponse response) throws PushRBException {
	    try {
	        TestPlan tp = findTestPlan(id);
	        InputStream testPlanIO = null;
//	        Set<String> ipidSet = this.findAllProfileIdsInTestPlan(tp);


//	          long range = 1234567L;
//	          Random r = new Random();
//	          Long rand = (long) (r.nextDouble() * range);
//
//	          for (String _id : ipidSet) {
//	            if (_id != null && !_id.isEmpty()) {
//	              InputStream[] xmlArrayIO = new InputStream[3];
//	              xmlArrayIO = new ExportUtil().exportProfileXMLArrayZip(_id, profileService);
//	            }
//	          }

	          testPlanIO = new ExportUtil().exportResourceBundleAsZip(tp,
	              testStoryConfigurationService, profileService);
	          
	          
	      ResponseEntity<?> rsp = gvtService.send(testPlanIO, authorization, url,domain);
	      Map<String, Object> res = (Map<String, Object>) rsp.getBody();
          testPlanRepository.save(tp);

	      return res;
	    }catch(Exception e){
	    	throw new PushRBException(e.getLocalizedMessage());
	    }
	    
	  } 


  private Set<String> findAllProfileIdsInTestPlan(TestPlan tp) {
    Set<String> ipidSet = new HashSet<String>();

    for (TestCaseOrGroup tcog : tp.getChildren()) {
      if (tcog instanceof TestCaseGroup) {
        TestCaseGroup group = (TestCaseGroup) tcog;
        visitGroup(group, ipidSet);
      } else if (tcog instanceof TestCase) {
        TestCase tc = (TestCase) tcog;
        for (TestStep ts : tc.getTeststeps()) {
          addProfileId(ts, ipidSet);
        }
      }
    }
    return ipidSet;
  }

  @RequestMapping(value = "/createSession", method = RequestMethod.POST,
      produces = "application/json")
  public ResponseEntity<Domain[]> createSession(@RequestBody String host,
      @RequestHeader("gvt-auth") String authorization) throws Exception {
    host = TestPlanController.GVT_URL;

    try {
      SSLHL7v2ResourceClient client = new SSLHL7v2ResourceClient(host, authorization);

     return client.getDomainByUsername();
    } catch (Exception e) {
      throw new Exception();
    }
  }

  @RequestMapping(value = "/{tpid}/exportProfileXMLs", method = RequestMethod.POST,
      produces = "text/xml", consumes = "application/x-www-form-urlencoded; charset=UTF-8")
  public void exportProfileXMLs(@PathVariable("tpid") String tpid, HttpServletRequest request,
      HttpServletResponse response) throws Exception {
    log.info("Exporting as zip files for TestPlan with id=" + tpid);
    TestPlan tp = findTestPlan(tpid);

    Set<String> ipidSet = this.findAllProfileIdsInTestPlan(tp);

    InputStream content = null;
    content = new ExportUtil().exportProfileXMLZip(ipidSet, profileService, 1234L);
    response.setContentType("application/zip");
    response.setHeader("Content-disposition", "attachment;filename=" + "Global.zip");
    FileCopyUtils.copy(content, response.getOutputStream());
  }

  private void addProfileId(TestStep ts, Set<String> ipidSet) {
    if (ts.getIntegrationProfileId() != null) {
      ipidSet.add(ts.getIntegrationProfileId());
    }
  }

  private void visitGroup(TestCaseGroup group, Set<String> ipidSet) {
    for (TestCaseOrGroup child : group.getChildren()) {
      if (child instanceof TestCaseGroup) {
        TestCaseGroup childGroup = (TestCaseGroup) child;
        visitGroup(childGroup, ipidSet);
      } else if (child instanceof TestCase) {
        TestCase childTestCase = (TestCase) child;
        for (TestStep ts : childTestCase.getTeststeps()) {
          addProfileId(ts, ipidSet);
        }
      }
    }

  }

  @RequestMapping(value = "/{id}/exportCover", method = RequestMethod.POST, produces = "text/xml",
      consumes = "application/x-www-form-urlencoded; charset=UTF-8")
  public void exportCoverPage(@PathVariable("id") String id, HttpServletRequest request,
      HttpServletResponse response) throws Exception {
    TestPlan tp = findTestPlan(id);
    InputStream content = null;
    content = new ExportUtil().exportCoverAsHtml(tp);
    response.setContentType("text/html");
    response.setHeader("Content-disposition", "attachment;filename=" + escapeSpace(tp.getName())
        + "-" + new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()) + "_CoverPage.html");
    FileCopyUtils.copy(content, response.getOutputStream());

  }

  @RequestMapping(value = "/{id}/exportJson", method = RequestMethod.POST, produces = "text/xml",
      consumes = "application/x-www-form-urlencoded; charset=UTF-8")
  public void exportTestPlanJson(@PathVariable("id") String id, HttpServletRequest request,
      HttpServletResponse response) throws Exception {
    TestPlan tp = findTestPlan(id);
    tp.setId(null);
    Set<String> ipIds = this.findAllProfileIdsInTestPlan(tp);
    Set<GrandProfile> grandProfiles = new HashSet<GrandProfile>();
    for (String ipid : ipIds) {
      GrandProfile gp = new GrandProfile();
      ProfileData pd = profileService.findOne(ipid);
      gp.setId(ipid);
      gp.setProfileXMLStr(pd.getProfileXMLFileStr());
      gp.setConstraintXMLStr(pd.getConstraintsXMLFileStr());
      gp.setValueSetXMLStr(pd.getValueSetXMLFileStr());
      grandProfiles.add(gp);
    }
    GrandTestPlan grandTestPlan = new GrandTestPlan();
    grandTestPlan.setTestplan(tp);
    grandTestPlan.setGrandProfiles(grandProfiles);

    InputStream content = null;
    ObjectMapper mapper = new ObjectMapper();
    String jsonInString = mapper.writeValueAsString(grandTestPlan);
    content = IOUtils.toInputStream(jsonInString, "UTF-8");
    response.setContentType("text/html");
    response.setHeader("Content-disposition", "attachment;filename=" + escapeSpace(tp.getName())
        + "-" + new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date()) + "_TestPlan.json");
    FileCopyUtils.copy(content, response.getOutputStream());
  }

  @RequestMapping(value = "/importJSON", method = RequestMethod.POST)
  public void importXMLFiles(@RequestBody TestPlanDataStr tpds) throws Exception {
    User u = userService.getCurrentUser();
    Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
    if (account == null) {
      throw new Exception();
    }

    ObjectMapper mapper = new ObjectMapper();
    GrandTestPlan grandTestPlan =
        mapper.readValue(tpds.getJsonTestPlanFileStr(), GrandTestPlan.class);
    TestPlan tp = grandTestPlan.getTestplan();


    for (GrandProfile gp : grandTestPlan.getGrandProfiles()) {
      ProfileData exsitProfileData = profileService.findOne(gp.getId());
      if (exsitProfileData != null && exsitProfileData.getAccountId().equals(account.getId())) {

      } else {
        ProfileData p = new ProfileData();
        p.setProfileXMLFileStr(gp.getProfileXMLStr());
        p.setConstraintsXMLFileStr(gp.getConstraintXMLStr());
        p.setValueSetXMLFileStr(gp.getValueSetXMLStr());
        p.setAccountId(account.getId());
        p.setLastUpdatedDate(new Date());
        p.setSourceType("private");
        String newProfileId = profileService.save(p).getId();
        String oldProfileId = gp.getId();
        this.updateProfileId(tp, oldProfileId, newProfileId);
      }
    }
    tp.setAccountId(account.getId());

    tp.setListOfIntegrationProfileIds(new ArrayList<String>());
    tp.setGlobalTestGroupConfigId(null);
    tp.setGlobalTestCaseConfigId(null);
    tp.setGlobalManualTestStepConfigId(null);
    tp.setGlobalAutoTestStepConfigId(null);
    testPlanService.save(tp);
  }

  private void updateProfileId(TestPlan tp, String oldProfileId, String newProfileId) {
    for (TestCaseOrGroup tcog : tp.getChildren()) {
      if (tcog instanceof TestCase) {
        TestCase tc = (TestCase) tcog;
        this.updateProfileIdCase(tc, oldProfileId, newProfileId);
      } else if (tcog instanceof TestCaseGroup) {
        TestCaseGroup tcg = (TestCaseGroup) tcog;
        this.updateProfileIdGroup(tcg, oldProfileId, newProfileId);
      }
    }

  }

  private void updateProfileIdGroup(TestCaseGroup tcg, String oldProfileId, String newProfileId) {
    for (TestCaseOrGroup tcog : tcg.getChildren()) {
      if (tcog instanceof TestCase) {
        TestCase tc = (TestCase) tcog;
        this.updateProfileIdCase(tc, oldProfileId, newProfileId);
      } else if (tcog instanceof TestCaseGroup) {
        TestCaseGroup child = (TestCaseGroup) tcog;
        this.updateProfileIdGroup(child, oldProfileId, newProfileId);
      }
    }
  }

  private void updateProfileIdCase(TestCase tc, String oldProfileId, String newProfileId) {
    for (TestStep ts : tc.getTeststeps()) {
      if (ts.getIntegrationProfileId() != null
          && ts.getIntegrationProfileId().equals(oldProfileId)) {
        ts.setIntegrationProfileId(newProfileId);
      }
    }
  }

  @RequestMapping(value = "/importOldJSON", method = RequestMethod.POST)
  public void importOldXMLFiles(@RequestBody TestPlanDataStr tpds) throws Exception {
    User u = userService.getCurrentUser();
    Account account = accountRepository.findByTheAccountsUsername(u.getUsername());
    if (account == null) {
      throw new Exception();
    }
    TestPlan tp = new TestPlan();
    JSONObject obj = new JSONObject(tpds.getJsonTestPlanFileStr());
    long range = Long.MAX_VALUE;
    Random r = new Random();
    tp.setLongId((long) (r.nextDouble() * range));
    tp.setName((String) obj.get("name"));
    tp.setAccountId(account.getId());
    tp.setCoverPageDate((String) obj.get("coverPageDate"));
    tp.setCoverPageSubTitle((String) obj.get("coverPageSubTitle"));
    tp.setCoverPageTitle((String) obj.get("coverPageTitle"));
    tp.setCoverPageVersion((String) obj.get("coverPageVersion"));
    tp.setDescription(Jsoup.parse((String) obj.get("description")).text());
    tp.setDomain("VR");
    tp.setTransport(true);
    tp.setType("Isolated");
    tp.setVersion((int) obj.get("version") + "");

    JSONArray groups = (JSONArray) obj.get("testcasegroups");

    HashMap<Integer, JSONObject> groupMap = new HashMap<Integer, JSONObject>();
    for (int i = 0; i < groups.length(); i++) {
      JSONObject g = groups.getJSONObject(i);
      groupMap.put((Integer) g.get("position"), g);
    }

    for (int i = 0; i < groups.length(); i++) {
      JSONObject g = groupMap.get(i + 1);

      TestCaseGroup tcg = new TestCaseGroup();
      tcg.setLongId((long) (r.nextDouble() * range));
      tcg.setDescription(Jsoup.parse((String) g.get("description")).text());
      tcg.setName((String) g.get("name"));
      tcg.setType("testcasegroup");

      JSONArray testcases = (JSONArray) g.get("testcases");

      HashMap<Integer, JSONObject> testcaseMap = new HashMap<Integer, JSONObject>();
      for (int j = 0; j < testcases.length(); j++) {
        JSONObject c = testcases.getJSONObject(j);
        testcaseMap.put((Integer) c.get("position"), c);
      }

      for (int j = 0; j < testcases.length(); j++) {
        JSONObject c = testcaseMap.get(j + 1);

        TestCase tc = new TestCase();
        tc.setLongId((long) (r.nextDouble() * range));
        tc.setDescription(Jsoup.parse((String) c.get("description")).text());
        tc.setName((String) c.get("name"));
        tc.setProtocol("soap");
        JSONObject testCaseStory = (JSONObject) c.get("testCaseStory");
        HashMap<String, String> testcaseStoryContent = new HashMap<String, String>();
        testcaseStoryContent.put("Description", (String) testCaseStory.get("teststorydesc"));
        testcaseStoryContent.put("Comments", (String) testCaseStory.get("comments"));
        testcaseStoryContent.put("Pre-condition", (String) testCaseStory.get("preCondition"));
        testcaseStoryContent.put("Post-Condition", (String) testCaseStory.get("postCondition"));
        testcaseStoryContent.put("Test Objectives", (String) testCaseStory.get("testObjectives"));
        testcaseStoryContent.put("Evaluation Criteria",
            (String) testCaseStory.get("evaluationCriteria"));
        testcaseStoryContent.put("Notes", (String) testCaseStory.get("notes"));
        tc.setTestStoryContent(testcaseStoryContent);
        tc.setType("testcase");

        JSONArray teststeps = (JSONArray) c.get("teststeps");

        HashMap<Integer, JSONObject> teststepMap = new HashMap<Integer, JSONObject>();
        for (int k = 0; k < teststeps.length(); k++) {
          JSONObject s = teststeps.getJSONObject(k);
          teststepMap.put((Integer) s.get("position"), s);
        }
        for (int k = 0; k < teststeps.length(); k++) {
          JSONObject s = teststepMap.get(k + 1);

          TestStep ts = new TestStep();
          ts.setLongId((long) (r.nextDouble() * range));
          ts.setDescription(Jsoup.parse((String) s.get("description")).text());

          JSONObject message = (JSONObject) s.get("message");
          if (message != null) {
            if (!message.isNull("hl7EndcodedMessage")) {
              ts.setEr7Message((String) message.get("hl7EndcodedMessage"));
              HashMap<String, Categorization> testDataCategorizationMap =
                  new HashMap<String, Categorization>();
              if (!message.isNull("tcamtConstraints")) {
                JSONArray tcamtConstraints = (JSONArray) message.get("tcamtConstraints");
                for (int l = 0; l < tcamtConstraints.length(); l++) {
                  JSONObject constraints = tcamtConstraints.getJSONObject(l);

                  String iPath = (String) constraints.get("ipath");
                  String key = iPath.replaceAll("\\.", "-");
                  String cate = (String) constraints.get("categorization");
                  Categorization value = new Categorization();
                  value.setiPath(iPath);

                  if (cate.equals("Indifferent")) {
                    value.setTestDataCategorization("Indifferent");
                  } else if (cate.equals("Presence_ContentIndifferent")) {
                    value.setTestDataCategorization("Presence-Content Indifferent");
                  } else if (cate.equals("Presence_Configuration")) {
                    value.setTestDataCategorization("Presence-Configuration");
                  } else if (cate.equals("Presence_SystemGenerated")) {
                    value.setTestDataCategorization("Presence-System Generated");
                  } else if (cate.equals("Presence_TestCaseProper")) {
                    value.setTestDataCategorization("Presence-Test Case Proper");
                  } else if (cate.equals("PresenceLength_ContentIndifferent")) {
                    value.setTestDataCategorization("Presence Length-Content Indifferent");
                  } else if (cate.equals("PresenceLength_Configuration")) {
                    value.setTestDataCategorization("Presence Length-Configuration");
                  } else if (cate.equals("PresenceLength_SystemGenerated")) {
                    value.setTestDataCategorization("Presence Length-System Generated");
                  } else if (cate.equals("PresenceLength_TestCaseProper")) {
                    value.setTestDataCategorization("Presence Length-Test Case Proper");
                  } else if (cate.equals("Value_TestCaseFixed")) {
                    value.setTestDataCategorization("Value-Test Case Fixed");
                  } else if (cate.equals("Value_TestCaseFixedList")) {
                    value.setTestDataCategorization("Value-Test Case Fixed List");
                    List<String> listData = new ArrayList<String>();
                    JSONArray listDataJson = (JSONArray) constraints.get("listData");
                    for (int m = 0; m < listDataJson.length(); m++) {
                      listData.add(listDataJson.getString(m));
                    }
                    value.setListData(listData);
                  } else if (cate.equals("NonPresence")) {
                    value.setTestDataCategorization("NonPresence");
                  } else if (cate.equals("Value_ProfileFixed")) {
                    value.setTestDataCategorization("Value-Profile Fixed");
                  } else if (cate.equals("Value_ProfileFixedList")) {
                    value.setTestDataCategorization("Value-Profile Fixed List");
                    List<String> listData = new ArrayList<String>();
                    JSONArray listDataJson = (JSONArray) constraints.get("listData");
                    for (int m = 0; m < listDataJson.length(); m++) {
                      listData.add(listDataJson.getString(m));
                    }
                  }
                  testDataCategorizationMap.put(key, value);
                }
                ts.setTestDataCategorizationMap(testDataCategorizationMap);
              }
            }
          }

          ts.setName((String) s.get("name"));
          JSONObject testStepStory = (JSONObject) s.get("testStepStory");
          HashMap<String, String> testStepStoryContent = new HashMap<String, String>();
          testStepStoryContent.put("Description", (String) testStepStory.get("teststorydesc"));
          testStepStoryContent.put("Comments", (String) testStepStory.get("comments"));
          testStepStoryContent.put("Pre-condition", (String) testStepStory.get("preCondition"));
          testStepStoryContent.put("Post-Condition", (String) testStepStory.get("postCondition"));
          testStepStoryContent.put("Test Objectives", (String) testStepStory.get("testObjectives"));
          testStepStoryContent.put("Evaluation Criteria",
              (String) testStepStory.get("evaluationCriteria"));
          testStepStoryContent.put("Notes", (String) testStepStory.get("notes"));
          ts.setTestStoryContent(testStepStoryContent);
          ts.setType("teststep");
          tc.addTestStep(ts);
        }
        tcg.addTestCaseOrGroup(tc);
      }

      tp.addTestCaseGroup(tcg);
    }

    testPlanService.save(tp);
  }

  private String escapeSpace(String str) {
    return str.replaceAll(" ", "-");
  }

  private void sendPushConfirmation(TestPlan doc, Account target) {

    SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);

    msg.setSubject("Your Test Plan is pushed to the GVT");
    msg.setTo(target.getEmail());
    msg.setText("Dear " + target.getUsername() + ", \n\n"
        + "your Test Plan has been successfully pushed to GVT. Now you can test it at "
        + TestPlanController.GVT_URL);
    try {
      this.mailSender.send(msg);

    } catch (MailException ex) {
      log.error(ex.getMessage(), ex);
    }
  }

  private void sendPushFailConfirmation(TestPlan doc, Account target, String host, Exception e) {
    SimpleMailMessage msg = new SimpleMailMessage(this.templateMessage);
    msg.setSubject("Push Test Plan Faild");
    msg.setTo(target.getEmail());
    String[] ccEmails = {"jungyub.woo@nist.gov", "abdelghani.elouakili@nist.gov"};
    msg.setCc(ccEmails);
    msg.setText("Dear " + target.getUsername() + ", \n\n"
        + "We are sorry but we couldn't push your testplan to the " + host
        + ". TCAMT team will contact you soon. \n\n" + "[Error]" + e.getMessage() + "\n\n"
        + "[TestPlan ID]" + doc.getId());
    try {
      this.mailSender.send(msg);

    } catch (MailException ex) {
      log.error(ex.getMessage(), ex);
    }
  }

}
