/**
 * This software was developed at the National Institute of Standards and Technology by employees of
 * the Federal Government in the course of their official duties. Pursuant to title 17 Section 105
 * of the United States Code this software is not subject to copyright protection and is in the
 * public domain. This is an experimental system. NIST assumes no responsibility whatsoever for its
 * use by other parties, and makes no guarantees, expressed or implied, about its quality,
 * reliability, or any other characteristic. We would appreciate acknowledgement if the software is
 * used. This software can be redistributed and/or modified freely provided that any derivative
 * works bear some notice that they are derived from it, and any modified versions bear some notice
 * that they have been modified.
 */

package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.config;

import java.io.UnsupportedEncodingException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ProfileData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TemplateService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestStoryConfigurationService;

@Service
public class Bootstrap implements InitializingBean {

  private final Logger logger = LoggerFactory.getLogger(this.getClass());

  @Autowired
  TestPlanService testplanService;

  @Autowired
  ProfileService profileService;

  @Autowired
  TemplateService templateService;

  @Autowired
  TestStoryConfigurationService testStoryConfigurationService;

  /*
   * (non-Javadoc)
   * 
   * @see org.springframework.beans.factory.InitializingBean#afterPropertiesSet()
   */
  @Override
  public void afterPropertiesSet() throws Exception {
	  //	this.encodeDecode();
  }
 

  public Logger getLogger() {
    return logger;
  }
  
  
  public void encodeDecode() throws Exception{
	 ProfileData profile = profileService.findOne("65bd02412d8670360bc31ede");
	  
          // The original encoded bytes. In a real scenario, this would come from a file or external source.
          // For demonstration, we're using a hardcoded string that represents "���" when misinterpreted as UTF-8.
	 
          String originalString = profile.getValueSetXMLFileStr();

          // Specify the correct source encoding
          String sourceEncoding = "ISO-8859-1";
          // Specify the target encoding
          String targetEncoding = "UTF-8";

          // Decode the string from the source encoding
          byte[] bytes = originalString.getBytes(sourceEncoding);
          String decodedString = new String(bytes, sourceEncoding);

          // Now encode it to the target encoding (UTF-8)
          byte[] utf8Bytes = decodedString.getBytes(targetEncoding);
          String encodedToUtf8 = new String(utf8Bytes, targetEncoding);

          // Print the results
          System.out.println("Decoded String: " + decodedString);
          System.out.println("Re-encoded to UTF-8: " + encodedToUtf8);
          profile.setValueSetXMLFileStr(encodedToUtf8);
         // profileService.save(profile);

      
  }
}
