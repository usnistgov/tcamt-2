package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal.SegmentNode;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ProfileData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.ConstraintParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.SegmentInstanceData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.SegmentParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepSupplementsOutput;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepSupplementsParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepXMLOutput;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepXMLParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.util.GenerationUtil;

@RestController
@RequestMapping("/teststep")

public class TestStepController extends CommonController {

  Logger log = LoggerFactory.getLogger(TestStepController.class);

  @Autowired
  ProfileService profileService;

  @RequestMapping(value = "/getSegmentList", method = RequestMethod.POST)
  public List<SegmentInstanceData> popSegmentList(@RequestBody TestStepParams params){
	  System.out.println(params.getIntegrationProfileId());
    try {
		return new GenerationUtil().popSegmentList(params,
		    profileService.findOne(params.getIntegrationProfileId()));
	} catch (Exception e) {
		// TODO Auto-generated catch block
		e.printStackTrace();
	}
    
    return null;
  }

  @RequestMapping(value = "/getSegmentNode", method = RequestMethod.POST)
  public SegmentNode popSegmentNode(@RequestBody SegmentParams params) {
    return new GenerationUtil().popSegmentNode(params,
        profileService.findOne(params.getIntegrationProfileId()));
  }

  @RequestMapping(value = "/getXMLs", method = RequestMethod.POST)
  public TestStepXMLOutput getXMLs(@RequestBody TestStepXMLParams params) throws Exception {
    return new GenerationUtil().getXMLs(params,
        profileService.findOne(params.getIntegrationProfileId()));
  }

  @RequestMapping(value = "/getSupplements", method = RequestMethod.POST)
  public TestStepSupplementsOutput getSupplements(@RequestBody TestStepSupplementsParams params)
      throws Exception {
    return new GenerationUtil().getSupplements(params,
        profileService.findOne(params.getIntegrationProfileId()));
  }

  @RequestMapping(value = "/getConstraintsXML", method = RequestMethod.POST)
  public ConstraintXMLOutPut getConstraintsXML(@RequestBody TestStepSupplementsParams params) throws Exception {
    return new GenerationUtil().getConstraintsXML(null,params,
        profileService.findOne(params.getIntegrationProfileId()));
  }
  
  @RequestMapping(value = "/getConstraintsData", method = RequestMethod.POST)
  public ConstraintXMLOutPut getConstraintsData(@RequestBody ConstraintParams params) throws Exception {
    return new GenerationUtil().getConstraintsData(params,
        profileService.findOne(params.getIntegrationProfileId()));
  }
  
  @RequestMapping(value = "/getProfileData", method = RequestMethod.POST)
  public ProfileData getProfileData(@RequestBody ConstraintParams params) throws Exception {
    return profileService.findOne(params.getIntegrationProfileId());
  }
}
