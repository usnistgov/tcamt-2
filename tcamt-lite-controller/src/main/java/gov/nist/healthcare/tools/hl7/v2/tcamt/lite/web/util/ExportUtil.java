package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCase;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestCaseOrGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestPlan;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStep;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStoryConfiguration;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TestStroyEntry;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ProfileData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepSupplementXMLsOutput;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepSupplementsParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.ProfileService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestStoryConfigurationService;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.util.XMLManager;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller.ConstraintXMLOutPut;

public class ExportUtil {
  final String OLD_FORMAT = "yyyyMMdd";
  final String NEW_FORMAT = "MM/dd/yyyy";

  public static String str(String value) {
    return value != null ? value : "";
  }

  public InputStream exportTestPackageAsHtml(TestPlan tp,
      TestStoryConfigurationService testStoryConfigurationService, ProfileService profileService) throws Exception {
    return IOUtils.toInputStream(this.genPackagePages(tp, testStoryConfigurationService, profileService), "UTF-8");
  }

  public InputStream exportCoverAsHtml(TestPlan tp) throws Exception {
    return IOUtils.toInputStream(this.genCoverPage(tp), "UTF-8");
  }

  private String genPackagePagesInsideGroup(TestPlan tp, TestCaseGroup group,
      String packageBodyHTML, String index,
      TestStoryConfigurationService testStoryConfigurationService, ProfileService profileService) throws Exception {
    packageBodyHTML = packageBodyHTML + "<A NAME=\"" + index + "\">" + "<h2>" + index + ". "
        + group.getName() + "</h2>" + System.getProperty("line.separator");
    packageBodyHTML = packageBodyHTML + "<span>" + group.getDescription() + "</span>"
        + System.getProperty("line.separator");
    packageBodyHTML =
        packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");
    String testStoryConfigId = null;
    if (group.getTestStoryConfigId() != null) {
      testStoryConfigId = group.getTestStoryConfigId();
    } else {
      testStoryConfigId = tp.getGlobalTestGroupConfigId();
    }

    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }

    packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(
        this.generateTestStory(group.getTestStoryContent(), testStoryConfiguration, "plain", tp));
    packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

    for (int i = 0; i < group.getChildren().size(); i++) {
      TestCaseOrGroup child = group.getChildren().get(i);
      if (child instanceof TestCaseGroup) {
        packageBodyHTML = genPackagePagesInsideGroup(tp, (TestCaseGroup) child, packageBodyHTML,
            index + "." + (i + 1), testStoryConfigurationService, profileService);
      } else if (child instanceof TestCase) {
        packageBodyHTML = genPackagePagesForTestCase(tp, (TestCase) child, packageBodyHTML,
            index + "." + (i + 1), testStoryConfigurationService, profileService);

      }
    }

    return packageBodyHTML;
  }

  private String genPackagePagesForTestCase(TestPlan tp, TestCase tc, String packageBodyHTML,
      String index, TestStoryConfigurationService testStoryConfigurationService, ProfileService profileService) throws Exception {
    packageBodyHTML = packageBodyHTML + "<A NAME=\"" + index + "\">" + "<h2>" + index + ". "
        + tc.getName() + "</h2>" + System.getProperty("line.separator");
    packageBodyHTML = packageBodyHTML + "<span>" + tc.getDescription() + "</span>"
        + System.getProperty("line.separator");
    packageBodyHTML =
        packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");
    String testStoryConfigId = null;
    if (tc.getTestStoryConfigId() != null) {
      testStoryConfigId = tc.getTestStoryConfigId();
    } else {
      testStoryConfigId = tp.getGlobalTestCaseConfigId();
    }

    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }

    packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(
        this.generateTestStory(tc.getTestStoryContent(), testStoryConfiguration, "plain", tp));
    packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

    for (int i = 0; i < tc.getTeststeps().size(); i++) {
      TestStep child = tc.getTeststeps().get(i);
      packageBodyHTML = genPackagePagesForTestStep(tp, child, packageBodyHTML,
          index + "." + (i + 1), testStoryConfigurationService, tc.getName(), profileService);
    }

    return packageBodyHTML;
  }

  private String genPackagePagesForTestStep(TestPlan tp, TestStep ts, String packageBodyHTML,
      String index, TestStoryConfigurationService testStoryConfigurationService, String testCaseName, ProfileService profileService) throws Exception {
    ClassLoader classLoader = getClass().getClassLoader();
    packageBodyHTML = packageBodyHTML + "<A NAME=\"" + index + "\">" + "<h2>" + index + ". "
        + ts.getName() + "</h2>" + System.getProperty("line.separator");
    if (tp.getType() != null && tp.getType().equals("Isolated")) {
      packageBodyHTML = packageBodyHTML + "<span>Test Step Type: " + ts.getType() + "</span><br/>"
          + System.getProperty("line.separator");
    }
    packageBodyHTML = packageBodyHTML + "<span>" + ts.getDescription() + "</span>"
        + System.getProperty("line.separator");
    packageBodyHTML =
        packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");

    String testStoryConfigId = null;
    if (ts.getTestStoryConfigId() != null) {
      testStoryConfigId = ts.getTestStoryConfigId();
    } else {
      if (ts.isManualTS()) {
        testStoryConfigId = tp.getGlobalManualTestStepConfigId();
      } else {
        testStoryConfigId = tp.getGlobalAutoTestStepConfigId();
      }
    }
    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }
    packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(
        this.generateTestStory(ts.getTestStoryContent(), testStoryConfiguration, "plain", tp));

    if (ts != null && ts.getEr7Message() != null && ts.getIntegrationProfileId() != null) {
      
      TestStepSupplementsParams params = new TestStepSupplementsParams();
      params.setConformanceProfileId(ts.getConformanceProfileId());
      params.setEr7Message(ts.getEr7Message());
      params.setIntegrationProfileId(ts.getIntegrationProfileId());
      params.setTestCaseName(testCaseName);
      params.setJdXSL(ts.getJdXSL());
      params.setTdsXSL(ts.getTdsXSL());
      params.setTestDataCategorizationMap(ts.getTestDataCategorizationMap());
      
      TestStepSupplementXMLsOutput testStepSupplementXMLsOutput = new GenerationUtil().getSupplementXMLs(params, profileService.findOne(params.getIntegrationProfileId()));
      
      if (testStepSupplementXMLsOutput != null && testStepSupplementXMLsOutput.getMessageContentsXMLStr() != null && !testStepSupplementXMLsOutput.getMessageContentsXMLStr().equals("")) {
        String mcXSL = IOUtils
            .toString(
                classLoader.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl"))
            .replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
                "<xsl:param name=\"output\" select=\"'plain-html'\"/>");
        InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
        InputStream sourceInputStream =
            new ByteArrayInputStream(testStepSupplementXMLsOutput.getMessageContentsXMLStr().getBytes());
        Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
        Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
        String xsltStr = IOUtils.toString(xsltReader);
        String sourceStr = IOUtils.toString(sourceReader);

        String messageContentHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
        packageBodyHTML = packageBodyHTML + "<h3>" + "Message Contents" + "</h3>"
            + System.getProperty("line.separator");
        packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(messageContentHTMLStr);
      }

      if (testStepSupplementXMLsOutput != null && testStepSupplementXMLsOutput.getNistXMLStr() != null && !testStepSupplementXMLsOutput.getNistXMLStr().equals("")) {
        if (ts.getTdsXSL() != null && !ts.getTdsXSL().equals("")) {
          String tdXSL = IOUtils
              .toString(
                  classLoader.getResourceAsStream("xsl" + File.separator + ts.getTdsXSL() + ".xsl"))
              .replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
                  "<xsl:param name=\"output\" select=\"'plain-html'\"/>");
          InputStream xsltInputStream = new ByteArrayInputStream(tdXSL.getBytes());
          InputStream sourceInputStream = new ByteArrayInputStream(testStepSupplementXMLsOutput.getNistXMLStr().getBytes());
          Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
          Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
          String xsltStr = IOUtils.toString(xsltReader);
          String sourceStr = IOUtils.toString(sourceReader);

          String testDataSpecificationHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
          packageBodyHTML = packageBodyHTML + "<h3>" + "Test Data Specification" + "</h3>"
              + System.getProperty("line.separator");
          packageBodyHTML =
              packageBodyHTML + this.retrieveBodyContent(testDataSpecificationHTMLStr);
        }

        if (ts.getJdXSL() != null && !ts.getJdXSL().equals("")) {
          
          if(params.getJdXSL().equals("IZ52-IZ33NF-IZ33TM-IZ33PD-JurorDocument")) {
            Document nistXMLDom = XMLManager.stringToDom(testStepSupplementXMLsOutput.getNistXMLStr());
            String qak2 = this.findDataByPath(nistXMLDom, "QAK.2");
              
            if(qak2.equals("OK")) {
              String jdTemplate = IOUtils.toString(classLoader.getResourceAsStream("jdTemplates" + File.separator + "JD_OK.txt"));
              jdTemplate = jdTemplate.replace("$testcasename$", testCaseName);

              String patientIdentifier = this.findDataByPath(nistXMLDom, "PID.3.1");
              jdTemplate = jdTemplate.replace("$patientIdentifier$", patientIdentifier);         
              
              String firstPatientName = this.findDataByPath(nistXMLDom, "PID.5.2");
              String middlePatientName = this.findDataByPath(nistXMLDom, "PID.5.3");
              String lastPatientName = this.findDataByPath(nistXMLDom, "PID.5.1.1");
              jdTemplate = jdTemplate.replace("$PatientName$", this.generateName(firstPatientName, middlePatientName, lastPatientName));
              
              String dob = this.findDataByPath(nistXMLDom, "PID.7");
              jdTemplate = jdTemplate.replace("$DOB$", this.changeDateFormat(dob));  
              
              String gender = this.findDataByPath(nistXMLDom, "PID.8.1");
              if(gender.equals("M")) jdTemplate = jdTemplate.replace("$Gender$", "Male"); 
              else if(gender.equals("F")) jdTemplate = jdTemplate.replace("$Gender$", "Female"); 
              else jdTemplate = jdTemplate.replace("$Gender$", gender);  
              
              String immunizationScheduleUsed = this.findDataByPathAndCondition(nistXMLDom, "OBX", "OBX.3.1", "59779-9", "OBX.5.2", 0);
              jdTemplate = jdTemplate.replace("$immunizationScheduleUsed$", immunizationScheduleUsed);
              
              
              String immunizationHistory = "";
              String immunizationForecast = "";
              
              NodeList COMPLETE_HISTORYGroups = nistXMLDom.getElementsByTagName("RSP_K11.COMPLETE_HISTORY");
              if(COMPLETE_HISTORYGroups != null && COMPLETE_HISTORYGroups.getLength() > 0) {
                for(int i=0; i<COMPLETE_HISTORYGroups.getLength(); i++) {
                  Element COMPLETE_HISTORYGroup = (Element)COMPLETE_HISTORYGroups.item(i);
                  
                  String value_RXA_5_1 = this.findDataByPath(COMPLETE_HISTORYGroup, "RXA.5.1");
                  
                  System.out.println(value_RXA_5_1);
                  
                  if(value_RXA_5_1.equals("998")) {

                    String immunizationForecastVaccineGroup = "";
                    String immunizationForecastDueDate = "";
                    String immunizationForecastEarliestDatetoGive = "";
                    String immunizationForecastLatestDatetoGive = "";
                    
                    NodeList obxSegments = COMPLETE_HISTORYGroup.getElementsByTagName("OBX");
                    
                    if(obxSegments != null && obxSegments.getLength() > 0) {
                      for(int j=obxSegments.getLength() - 1 ; j>-1; j--) {
                        Element obxSegment = (Element)obxSegments.item(j);
                        if(this.findDataByPath(obxSegment, "OBX.3.1").equals("30956-7")) {
                          immunizationForecastVaccineGroup = this.findDataByPath(obxSegment, "OBX.5.2");
                          String trHTML = "<tr>";                
                          if(immunizationForecastVaccineGroup.equals("NOT_Found") || immunizationForecastVaccineGroup.equals("")) {
                            trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                          } else {
                            trHTML = trHTML + "<td style=\"text-align: center;\">" + immunizationForecastVaccineGroup + "</td>";
                          }
                          if(immunizationForecastDueDate.equals("NOT_Found") || immunizationForecastDueDate.equals("")) {
                            trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                          } else {
                            trHTML = trHTML + "<td style=\"text-align: center;\">" + this.changeDateFormat(immunizationForecastDueDate) + "</td>";
                          }
                          if(immunizationForecastEarliestDatetoGive.equals("NOT_Found") || immunizationForecastEarliestDatetoGive.equals("")) {
                            trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                          } else {
                            trHTML = trHTML + "<td style=\"text-align: center;\">" + this.changeDateFormat(immunizationForecastEarliestDatetoGive) + "</td>";
                          }
                          if(immunizationForecastLatestDatetoGive.equals("NOT_Found") || immunizationForecastLatestDatetoGive.equals("")) {
                            trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                          } else {
                            trHTML = trHTML + "<td style=\"text-align: center;\">" + this.changeDateFormat(immunizationForecastLatestDatetoGive) + "</td>";
                          }
                          trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#F2F2F2\"><textarea maxlength=\"100\" rows=\"1\" style=\"width: 100%; height: 100%; border: 1px; background: 1px  #F2F2F2; resize:vertical; overflow-y:hidden \"></textarea></td>";
                          trHTML = trHTML + "</tr>";
                          immunizationForecastVaccineGroup = "";
                          immunizationForecastDueDate = "";
                          immunizationForecastEarliestDatetoGive = "";
                          immunizationForecastLatestDatetoGive = "";
                          immunizationForecast = trHTML + immunizationForecast;                      
                        } else if(this.findDataByPath(obxSegment, "OBX.3.1").equals("30980-7")) {
                          immunizationForecastDueDate = this.findDataByPath(obxSegment, "OBX.5.1");
                        } else if(this.findDataByPath(obxSegment, "OBX.3.1").equals("30981-5")) {
                          immunizationForecastEarliestDatetoGive = this.findDataByPath(obxSegment, "OBX.5.1");
                        } else if(this.findDataByPath(obxSegment, "OBX.3.1").equals("59777-3")) {
                          immunizationForecastLatestDatetoGive = this.findDataByPath(obxSegment, "OBX.5.1");
                        }
                      }
                    }
                  } else {                
                    String immunizationHistoryVaccineGroup = "";
                    String immunizationHistoryVaccineAdministered = this.findDataByPath(COMPLETE_HISTORYGroup, "RXA.5.2");
                    String immunizationHistoryDateAdministered = this.findDataByPath(COMPLETE_HISTORYGroup, "RXA.3");
                    String immunizationHistoryValidDose = "";
                    String immunizationHistoryValidityReason = "";
                    String immunizationHistoryCompletionStatus = this.findDataByPath(COMPLETE_HISTORYGroup, "RXA.20");
                    
                    NodeList obxSegments = COMPLETE_HISTORYGroup.getElementsByTagName("OBX");
                    
                    if(obxSegments != null && obxSegments.getLength() > 0) {
                      for(int j=obxSegments.getLength() - 1 ; j>-1; j--) {
                        Element obxSegment = (Element)obxSegments.item(j);
                        if(this.findDataByPath(obxSegment, "OBX.3.1").equals("30956-7")) {
                          immunizationHistoryVaccineGroup = this.findDataByPath(obxSegment, "OBX.5.2");
                          String trHTML = "<tr>";
                          
                          if(immunizationHistoryVaccineGroup.equals("NOT_Found") || immunizationHistoryVaccineGroup.equals("")) {
                            trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                          } else {
                            trHTML = trHTML + "<td style=\"text-align: center;\">" + immunizationHistoryVaccineGroup + "</td>";
                          }
                          
                          if(immunizationHistoryVaccineAdministered.equals("NOT_Found") || immunizationHistoryVaccineAdministered.equals("")) {
                            trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                          } else {
                            trHTML = trHTML + "<td style=\"text-align: center;\">" + immunizationHistoryVaccineAdministered + "</td>";
                          }
                          
                          if(immunizationHistoryDateAdministered.equals("NOT_Found") || immunizationHistoryDateAdministered.equals("")) {
                            trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                          } else {
                            trHTML = trHTML + "<td style=\"text-align: center;\">" + this.changeDateFormat(immunizationHistoryDateAdministered) + "</td>";
                          }
                          
                          if(immunizationHistoryValidDose.equals("NOT_Found") || immunizationHistoryValidDose.equals("")) {
                            trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                          } else {
                            if(immunizationHistoryValidDose.equals("Y")) {
                              trHTML = trHTML + "<td style=\"text-align: center;\">" + "YES" + "</td>";                    
                            } else if(immunizationHistoryValidDose.equals("N")) {
                              trHTML = trHTML + "<td style=\"text-align: center;\">" + "NO" + "</td>";                    
                            } else {
                              trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                            }
                          }
                          
                          if(immunizationHistoryValidityReason.equals("NOT_Found") || immunizationHistoryValidityReason.equals("")) {
                            trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                          } else {
                            trHTML = trHTML + "<td style=\"text-align: center;\">" + immunizationHistoryValidityReason + "</td>";
                          }
                          
                          if(immunizationHistoryCompletionStatus.equals("NOT_Found") || immunizationHistoryCompletionStatus.equals("")) {
                            trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                          } else {
                            if(immunizationHistoryCompletionStatus.equals("CP")) {
                              trHTML = trHTML + "<td style=\"text-align: center;\">" + "Complete" + "</td>";                    
                            } else if(immunizationHistoryCompletionStatus.equals("RE")) {
                              trHTML = trHTML + "<td style=\"text-align: center;\">" + "Refused" + "</td>";                    
                            } else if(immunizationHistoryCompletionStatus.equals("NA")) {
                              trHTML = trHTML + "<td style=\"text-align: center;\">" + "Not Administered" + "</td>";                    
                            } else if(immunizationHistoryCompletionStatus.equals("PA")) {
                              trHTML = trHTML + "<td style=\"text-align: center;\">" + "Partially Administered" + "</td>";                    
                            } else {
                              trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#D2D2D2\"></td>";
                            }
                          }
                          trHTML = trHTML + "<td style=\"text-align: center;\" bgcolor=\"#F2F2F2\"><textarea maxlength=\"100\" rows=\"1\" style=\"width: 100%; height: 100%; border: 1px; background: 1px  #F2F2F2; resize:vertical; overflow-y:hidden \"></textarea></td>";
                          trHTML = trHTML + "</tr>";
                          immunizationHistoryVaccineGroup = "";
                          immunizationHistoryValidDose = "";
                          immunizationHistoryValidityReason = "";
                          
                          immunizationHistory =  immunizationHistory + trHTML;
                        }else if(this.findDataByPath(obxSegment, "OBX.3.1").equals("59781-5")) {
                          immunizationHistoryValidDose = this.findDataByPath(obxSegment, "OBX.5.1");
                        } else if(this.findDataByPath(obxSegment, "OBX.3.1").equals("30982-3")) {
                          immunizationHistoryValidityReason = this.findDataByPath(obxSegment, "OBX.5.1");
                        } 
                      }
                    }
                  }
                }
              }
              jdTemplate = jdTemplate.replace("$immunizationHistory$", immunizationHistory);
              jdTemplate = jdTemplate.replace("$immunizationForecast$", immunizationForecast);
              packageBodyHTML = packageBodyHTML + "<h3>" + "Juror Document" + "</h3>" + System.getProperty("line.separator");
              packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(jdTemplate);
            } else if (qak2.equals("NF")) {
              String jdTemplate = IOUtils.toString(classLoader.getResourceAsStream("jdTemplates" + File.separator + "JD_NF.txt"));
              jdTemplate = jdTemplate.replace("$testcasename$", testCaseName);
              String patientIdentifier = this.findDataByPath(nistXMLDom, "QPD.3.1");
              jdTemplate = jdTemplate.replace("$patientIdentifier$", patientIdentifier);         
              
              String firstPatientName = this.findDataByPath(nistXMLDom, "QPD.4.2");
              String middlePatientName = this.findDataByPath(nistXMLDom, "QPD.4.3");
              String lastPatientName = this.findDataByPath(nistXMLDom, "QPD.4.1.1");
              jdTemplate = jdTemplate.replace("$PatientName$", this.generateName(firstPatientName, middlePatientName, lastPatientName));

              String dob = this.findDataByPath(nistXMLDom, "QPD.6");
              jdTemplate = jdTemplate.replace("$DOB$", this.changeDateFormat(dob));  
              
              String gender = this.findDataByPath(nistXMLDom, "QPD.7.1");
              if(gender.equals("M")) jdTemplate = jdTemplate.replace("$Gender$", "Male"); 
              else if(gender.equals("F")) jdTemplate = jdTemplate.replace("$Gender$", "Female"); 
              else jdTemplate = jdTemplate.replace("$Gender$", gender); 
              
              packageBodyHTML = packageBodyHTML + "<h3>" + "Juror Document" + "</h3>" + System.getProperty("line.separator");
              packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(jdTemplate);
            } else if (qak2.equals("PD")) {
              String jdTemplate = IOUtils.toString(classLoader.getResourceAsStream("jdTemplates" + File.separator + "JD_PD.txt"));
              jdTemplate = jdTemplate.replace("$testcasename$", testCaseName);
              String patientIdentifier = this.findDataByPath(nistXMLDom, "QPD.3.1");
              jdTemplate = jdTemplate.replace("$patientIdentifier$", patientIdentifier);         
              
              String firstPatientName = this.findDataByPath(nistXMLDom, "QPD.4.2");
              String middlePatientName = this.findDataByPath(nistXMLDom, "QPD.4.3");
              String lastPatientName = this.findDataByPath(nistXMLDom, "QPD.4.1.1");
              jdTemplate = jdTemplate.replace("$PatientName$", this.generateName(firstPatientName, middlePatientName, lastPatientName));

              String dob = this.findDataByPath(nistXMLDom, "QPD.6");
              jdTemplate = jdTemplate.replace("$DOB$", this.changeDateFormat(dob));  
              
              String gender = this.findDataByPath(nistXMLDom, "QPD.7.1");
              if(gender.equals("M")) jdTemplate = jdTemplate.replace("$Gender$", "Male"); 
              else if(gender.equals("F")) jdTemplate = jdTemplate.replace("$Gender$", "Female"); 
              else jdTemplate = jdTemplate.replace("$Gender$", gender); 
              
              packageBodyHTML = packageBodyHTML + "<h3>" + "Juror Document" + "</h3>" + System.getProperty("line.separator");
              packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(jdTemplate);
            } else if (qak2.equals("TM")) {
              String jdTemplate = IOUtils.toString(classLoader.getResourceAsStream("jdTemplates" + File.separator + "JD_TM.txt"));
              jdTemplate = jdTemplate.replace("$testcasename$", testCaseName);
              String patientIdentifier = this.findDataByPath(nistXMLDom, "QPD.3.1");
              jdTemplate = jdTemplate.replace("$patientIdentifier$", patientIdentifier);         
              
              String firstPatientName = this.findDataByPath(nistXMLDom, "QPD.4.2");
              String middlePatientName = this.findDataByPath(nistXMLDom, "QPD.4.3");
              String lastPatientName = this.findDataByPath(nistXMLDom, "QPD.4.1.1");
              jdTemplate = jdTemplate.replace("$PatientName$", this.generateName(firstPatientName, middlePatientName, lastPatientName));

              String dob = this.findDataByPath(nistXMLDom, "QPD.6");
              jdTemplate = jdTemplate.replace("$DOB$", this.changeDateFormat(dob));  
              
              String gender = this.findDataByPath(nistXMLDom, "QPD.7.1");
              if(gender.equals("M")) jdTemplate = jdTemplate.replace("$Gender$", "Male"); 
              else if(gender.equals("F")) jdTemplate = jdTemplate.replace("$Gender$", "Female"); 
              else jdTemplate = jdTemplate.replace("$Gender$", gender); 

              packageBodyHTML = packageBodyHTML + "<h3>" + "Juror Document" + "</h3>" + System.getProperty("line.separator");
              packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(jdTemplate);  
            }
          } else {
            String jdXSL = IOUtils.toString(
                classLoader.getResourceAsStream("xsl" + File.separator + ts.getJdXSL() + ".xsl"));
            InputStream xsltInputStream = new ByteArrayInputStream(jdXSL.getBytes());
            InputStream sourceInputStream = new ByteArrayInputStream(testStepSupplementXMLsOutput.getNistXMLStr().getBytes());
            Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
            Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
            String xsltStr = IOUtils.toString(xsltReader);
            String sourceStr = IOUtils.toString(sourceReader);

            String jurorDocumentHTMLStr = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
            packageBodyHTML = packageBodyHTML + "<h3>" + "Juror Document" + "</h3>" + System.getProperty("line.separator");
            packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(jurorDocumentHTMLStr);            
          }
        }
      }
    }
    packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";
    return packageBodyHTML;
  }
  
  private String findDataByPathAndCondition(Document nistXMLDom, String path, String path2, String value, String target, int index) {
    if (nistXMLDom != null && path != null) {
      NodeList founds = nistXMLDom.getElementsByTagName(path);
      if(founds != null) {
        for(int i = 0; i < founds.getLength(); i++) {
          Element found = (Element)founds.item(i);
          
          NodeList secondFounds = found.getElementsByTagName(path2);
          
          if(secondFounds != null && secondFounds.getLength() > 0) {
            Element secondfound = (Element)secondFounds.item(0);
            
            if(secondfound != null) {
              if(secondfound.getChildNodes() != null && secondfound.getChildNodes().item(0) != null) {
                if(secondfound.getChildNodes().item(0).getNodeValue().equals(value)) {
                  
                  NodeList targets = found.getElementsByTagName(target);
                  
                  if(targets != null && targets.getLength() > index) {
                    if(targets.item(index).getChildNodes() != null && targets.item(index).getChildNodes().item(0) != null) {
                      return targets.item(index).getChildNodes().item(0).getNodeValue();
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return "NOT_Found";
  }
  
  private String findDataByPath(Document nistXMLDom, String path) {
    List<String> results = new ArrayList<String>();
    
    if (nistXMLDom != null && path != null) {
      NodeList founds = nistXMLDom.getElementsByTagName(path);
      if(founds != null) {
        for(int i = 0; i < founds.getLength(); i++) {
          Element found = (Element)founds.item(i);
          if(found.getChildNodes() != null && found.getChildNodes().item(0) != null) {
            results.add(found.getChildNodes().item(0).getNodeValue());            
          }
        }
      }
    }
    if(results.size() > 0) {
      return results.get(0);
    }
    return "NOT_Found";
  }
  
  private String findDataByPath(Element elm, String path) {
    List<String> results = new ArrayList<String>();
    
    if (elm != null && path != null) {
      NodeList founds = elm.getElementsByTagName(path);
      if(founds != null) {
        for(int i = 0; i < founds.getLength(); i++) {
          Element found = (Element)founds.item(i);
          if(found.getChildNodes() != null && found.getChildNodes().item(0) != null) {
            results.add(found.getChildNodes().item(0).getNodeValue());            
          }
        }
      }
    }
    if(results.size() > 0) {
      return results.get(0);
    }
    return "NOT_Found";
  }
  
  private String changeDateFormat(String date) {
    String oldDateString = date;
    SimpleDateFormat sdf = new SimpleDateFormat(OLD_FORMAT);
    Date d;
    try {
      d = sdf.parse(oldDateString);
      sdf.applyPattern(NEW_FORMAT);
      return sdf.format(d);
    } catch (ParseException e) {
      return "Wrong Formatted Date";
    }
  }
  
  private String generateName(String firstPatientName, String middlePatientName,String lastPatientName) {
    if(middlePatientName == null || middlePatientName.equals("NOT_Found")) {
      return firstPatientName + " " + lastPatientName;
    }
    return firstPatientName + " " + middlePatientName + " " + lastPatientName;
  }

  private String genPackagePages(TestPlan tp,
      TestStoryConfigurationService testStoryConfigurationService, ProfileService profileService) throws Exception {
    ClassLoader classLoader = getClass().getClassLoader();

    String packageBodyHTML = "";
    packageBodyHTML =
        packageBodyHTML + "<h1>" + tp.getName() + "</h1>" + System.getProperty("line.separator");
    packageBodyHTML = packageBodyHTML + tp.getDescription() + System.getProperty("line.separator");
    packageBodyHTML =
        packageBodyHTML + "<h3>" + "Test Story" + "</h3>" + System.getProperty("line.separator");
    String testStoryConfigId = null;
    if (tp.getTestStoryConfigId() != null) {
      testStoryConfigId = tp.getTestStoryConfigId();
    }

    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }

    packageBodyHTML = packageBodyHTML + this.retrieveBodyContent(
        this.generateTestStory(tp.getTestStoryContent(), testStoryConfiguration, "plain", tp));
    packageBodyHTML = packageBodyHTML + "<p style=\"page-break-after:always;\"></p>";

    for (int i = 0; i < tp.getChildren().size(); i++) {
      TestCaseOrGroup child = tp.getChildren().get(i);
      if (child instanceof TestCaseGroup) {
        packageBodyHTML = genPackagePagesInsideGroup(tp, (TestCaseGroup) child, packageBodyHTML,
            "" + (i + 1), testStoryConfigurationService, profileService);
      } else if (child instanceof TestCase) {
        packageBodyHTML = genPackagePagesForTestCase(tp, (TestCase) child, packageBodyHTML,
            "" + (i + 1), testStoryConfigurationService, profileService);
      }
    }

    String testPackageStr = IOUtils
        .toString(classLoader.getResourceAsStream("rb" + File.separator + "TestPackage.html"));
    testPackageStr = testPackageStr.replace("?bodyContent?", packageBodyHTML);
    return testPackageStr;
  }

  private String retrieveBodyContent(String generateTestStory) {

    int beginIndex = generateTestStory.indexOf("<body>");
    int endIndex = generateTestStory.indexOf("</body>");

    return "" + generateTestStory.subSequence(beginIndex + "<body>".length(), endIndex);
  }

  private String generateTestStory(HashMap<String, String> testStoryContent,
      TestStoryConfiguration testStoryConfiguration, String option, TestPlan tp) throws Exception {
    ClassLoader classLoader = getClass().getClassLoader();

    if (option.equals("ng-tab-html")) {
      String testStoryStr = IOUtils.toString(
          classLoader.getResourceAsStream("rb" + File.separator + "ng-tab-html-TestStory.html"));

      HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
      for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
        testStroyEntryMap.put(tse.getPosition(), tse);
      }
      String fullStory = "";
      String tabStory = "";

      for (int i = 0; i < testStroyEntryMap.size(); i++) {
        TestStroyEntry tse = testStroyEntryMap.get(i + 1);

        if (tse.isPresent()) {
          String title = tse.getTitle();
          String content = testStoryContent.get(tse.getId());

          if (tp.isEmptyStoryContentIgnored()) {
            if (content != null && !"".equals(content)) {
              fullStory = fullStory + "<div class=\"panel-body\"><table><tr><th>" + title
                  + "</th></tr><tr><td>" + content + "</td></tr></table></div><br/>";
              tabStory = tabStory + "<tab heading=\"" + title + "\" vertical=\"false\">"
                  + "<div class=\"panel-body\"><table><tr><th>" + title + "</th></tr><tr><td>"
                  + content + "</td></tr></table></div></tab>";
            }
          } else {
            fullStory = fullStory + "<div class=\"panel-body\"><table><tr><th>" + title
                + "</th></tr><tr><td>" + content + "</td></tr></table></div><br/>";
            tabStory = tabStory + "<tab heading=\"" + title + "\" vertical=\"false\">"
                + "<div class=\"panel-body\"><table><tr><th>" + title + "</th></tr><tr><td>"
                + content + "</td></tr></table></div></tab>";
          }

        }
      }

      return testStoryStr.replace("?FullStory?", fullStory).replace("?TABStory?", tabStory);

    } else {
      String testStoryStr = IOUtils
          .toString(classLoader.getResourceAsStream("rb" + File.separator + "PlainTestStory.html"));

      HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
      for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
        testStroyEntryMap.put(tse.getPosition(), tse);
      }
      String storyContent = "";

      for (int i = 0; i < testStroyEntryMap.size(); i++) {
        TestStroyEntry tse = testStroyEntryMap.get(i + 1);

        if (tse.isPresent()) {
          String title = tse.getTitle();
          String content = testStoryContent.get(tse.getId());

          if (tp.isEmptyStoryContentIgnored()) {
            if (content != null && !"".equals(content))
              storyContent = storyContent + "<table><tr><th>" + title + "</th></tr><tr><td>"
                  + content + "</td></tr></table><br/>";
          } else {
            storyContent = storyContent + "<table><tr><th>" + title + "</th></tr><tr><td>" + content
                + "</td></tr></table><br/>";
          }

        }
      }

      return testStoryStr.replace("?TestStoryContents?", storyContent);

    }
  }

  private String genCoverPage(TestPlan tp) throws IOException {
    ClassLoader classLoader = getClass().getClassLoader();

    String coverpageStr =
        IOUtils.toString(classLoader.getResourceAsStream("rb" + File.separator + "CoverPage.html"));

    if (tp.getCoverPageTitle() == null || tp.getCoverPageTitle().equals("")) {
      coverpageStr = coverpageStr.replace("?title?", "No Title");
    } else {
      coverpageStr = coverpageStr.replace("?title?", tp.getCoverPageTitle());
    }

    if (tp.getCoverPageSubTitle() == null || tp.getCoverPageSubTitle().equals("")) {
      coverpageStr = coverpageStr.replace("?subtitle?", "No SubTitle");
    } else {
      coverpageStr = coverpageStr.replace("?subtitle?", tp.getCoverPageSubTitle());
    }

    if (tp.getCoverPageVersion() == null || tp.getCoverPageVersion().equals("")) {
      coverpageStr = coverpageStr.replace("?version?", "No Version");
    } else {
      coverpageStr = coverpageStr.replace("?version?", tp.getCoverPageVersion());
    }

    if (tp.getCoverPageDate() == null || tp.getCoverPageDate().equals("")) {
      coverpageStr = coverpageStr.replace("?date?", "No Date");
    } else {
      coverpageStr = coverpageStr.replace("?date?", tp.getCoverPageDate());
    }

    return coverpageStr;
  }
  
  public InputStream exportResourceBundlePushRBAsZip(TestPlan tp, TestStoryConfigurationService testStoryConfigurationService, ProfileService profileService) throws Exception {
    ByteArrayOutputStream outputStream = null;
    byte[] bytes;
    outputStream = new ByteArrayOutputStream();
    ZipOutputStream out = new ZipOutputStream(outputStream);
    
    String rootPath = tp.getName();
    this.genCoverAsHtml(out, tp, rootPath);
    this.genPackagePages(out, tp, testStoryConfigurationService, profileService, rootPath);
    this.generateTestPlanSummary(out, tp, testStoryConfigurationService, rootPath);
    this.generateTestPlanRB(out, tp, testStoryConfigurationService, profileService, rootPath);
    out.close();
    bytes = outputStream.toByteArray();
    return new ByteArrayInputStream(bytes);
  }
  

  public InputStream exportResourceBundleAsZip(TestPlan tp, TestStoryConfigurationService testStoryConfigurationService, ProfileService profileService) throws Exception {
    ByteArrayOutputStream outputStream = null;
    byte[] bytes;
    outputStream = new ByteArrayOutputStream();
    ZipOutputStream out = new ZipOutputStream(outputStream);
    
    Map<String, String> ipidMap = new HashMap<String, String>();

    for (TestCaseOrGroup tcog : tp.getChildren()) {
      if (tcog instanceof TestCaseGroup) {
        TestCaseGroup group = (TestCaseGroup) tcog;
        visitGroup(group, ipidMap);
      } else if (tcog instanceof TestCase) {
        TestCase tc = (TestCase) tcog;
        for (TestStep ts : tc.getTeststeps()) {
          addProfileId(ts, ipidMap);
        }
      }
    }
    
    for (String id : ipidMap.keySet()) {
      if (id != null && !id.isEmpty()) {
        ProfileData profileData = profileService.findOne(id);
        if(profileData != null) {
          this.genProfileAsXML(out, tp, profileData.getId(), profileData.getProfileXMLFileStr());
          this.genValueSetAsXML(out, tp, profileData.getId(), profileData.getValueSetXMLFileStr());
          this.genConstraintsAsXML(out, tp, profileData.getId(), profileData.getConstraintsXMLFileStr());
        }
        
      }
    }
    
    String rootPath = "Contextbased" + File.separator + tp.getName();
    this.genCoverAsHtml(out, tp, rootPath);
    this.genPackagePages(out, tp, testStoryConfigurationService, profileService, rootPath);
    this.generateTestPlanSummary(out, tp, testStoryConfigurationService, rootPath);
    this.generateTestPlanRB(out, tp, testStoryConfigurationService, profileService, rootPath);
    out.close();
    bytes = outputStream.toByteArray();
    return new ByteArrayInputStream(bytes);
  }

  private void addProfileId(TestStep ts, Map<String, String> ipidMap) {
    if (ts.getIntegrationProfileId() != null) {
      ipidMap.put(ts.getIntegrationProfileId(), ts.getIntegrationProfileId());
    }
  }

  private void visitGroup(TestCaseGroup group, Map<String, String> ipidMap) {
    for (TestCaseOrGroup child : group.getChildren()) {
      if (child instanceof TestCaseGroup) {
        TestCaseGroup childGroup = (TestCaseGroup) child;
        visitGroup(childGroup, ipidMap);
      } else if (child instanceof TestCase) {
        TestCase childTestCase = (TestCase) child;
        for (TestStep ts : childTestCase.getTeststeps()) {
          addProfileId(ts, ipidMap);
        }
      }
    }

  }

  private void genProfileAsXML(ZipOutputStream out, TestPlan tp, String profileId, String profileXML) throws Exception {
    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry("Global" + File.separator + "Profiles" + File.separator + profileId + "_Profile.xml"));
    InputStream profileIn = IOUtils.toInputStream(profileXML);
    int lenTestPlanSummary;
    while ((lenTestPlanSummary = profileIn.read(buf)) > 0) {
      out.write(buf, 0, lenTestPlanSummary);
    }
    out.closeEntry();
    profileIn.close();
    
  }
  
  private void genValueSetAsXML(ZipOutputStream out, TestPlan tp, String id,
      String valueSetXMLFileStr) throws IOException {
    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry("Global" + File.separator + "Tables" + File.separator + id + "_ValueSets.xml"));
    InputStream profileIn = IOUtils.toInputStream(valueSetXMLFileStr);
    int lenTestPlanSummary;
    while ((lenTestPlanSummary = profileIn.read(buf)) > 0) {
      out.write(buf, 0, lenTestPlanSummary);
    }
    out.closeEntry();
    profileIn.close();
  }
  
  private void genConstraintsAsXML(ZipOutputStream out, TestPlan tp, String id,
      String constraintsXMLFileStr) throws IOException {
    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry("Global" + File.separator + "Constraints" + File.separator + id + "_Constraints.xml"));
    InputStream profileIn = IOUtils.toInputStream(constraintsXMLFileStr);
    int lenTestPlanSummary;
    while ((lenTestPlanSummary = profileIn.read(buf)) > 0) {
      out.write(buf, 0, lenTestPlanSummary);
    }
    out.closeEntry();
    profileIn.close();
  }

  private void genCoverAsHtml(ZipOutputStream out, TestPlan tp, String rootPath) throws Exception {
    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry(rootPath + File.separator + "CoverPage.html"));
    InputStream inCoverPager = this.exportCoverAsHtml(tp);
    int lenTestPlanSummary;
    while ((lenTestPlanSummary = inCoverPager.read(buf)) > 0) {
      out.write(buf, 0, lenTestPlanSummary);
    }
    out.closeEntry();
    inCoverPager.close();
  }
 
  private void genPackagePages(ZipOutputStream out, TestPlan tp,
      TestStoryConfigurationService testStoryConfigurationService, ProfileService profileService, String rootPath) throws Exception {

    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry(rootPath + File.separator + "TestPackage.html"));
    InputStream inTestPackage = this.exportTestPackageAsHtml(tp, testStoryConfigurationService, profileService);
    int lenTestPlanSummary;
    while ((lenTestPlanSummary = inTestPackage.read(buf)) > 0) {
      out.write(buf, 0, lenTestPlanSummary);
    }
    out.closeEntry();
    inTestPackage.close();
  }

  private void generateTestPlanRBTestGroup(ZipOutputStream out, TestCaseGroup group, String path, TestPlan tp, TestStoryConfigurationService testStoryConfigurationService, int index, ProfileService profileService) throws Exception {
    String groupPath = "";
    if (path == null) {
      groupPath = "Contextbased" + File.separator + tp.getName() + File.separator + "TestGroup_" + index;
    } else {
      groupPath = path + File.separator + "TestGroup_" + index;
    }
    this.generateTestGroupJsonRB(out, group, groupPath, index);

    String testStoryConfigId = null;
    if (group.getTestStoryConfigId() != null) {
      testStoryConfigId = group.getTestStoryConfigId();
    } else {
      testStoryConfigId = tp.getGlobalTestGroupConfigId();
    }

    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }

    this.generateTestStoryRB(out, group.getTestStoryContent(), testStoryConfiguration, groupPath,
        tp, "ng-tab-html");
    this.generateTestStoryRB(out, group.getTestStoryContent(), testStoryConfiguration, groupPath,
        tp, "plain");

    for (int i = 0; i < group.getChildren().size(); i++) {
      TestCaseOrGroup child = group.getChildren().get(i);
      if (child instanceof TestCaseGroup) {
        generateTestPlanRBTestGroup(out, (TestCaseGroup) child, groupPath, tp, testStoryConfigurationService, i + 1, profileService);
      } else if (child instanceof TestCase) {
        generateTestPlanRBTestCase(out, (TestCase) child, groupPath, tp, testStoryConfigurationService, i + 1, profileService);
      }
    }
  }

  private void generateTestPlanRBTestCase(ZipOutputStream out, TestCase tc, String path, TestPlan tp, TestStoryConfigurationService testStoryConfigurationService, int index, ProfileService profileService) throws Exception {
    String tcPath = "";
    if (path == null) {
      tcPath = tp.getId() + File.separator + "TestCase_" + index;
    } else {
      tcPath = path + File.separator + "TestCase_" + index;
    }
    this.generateTestCaseJsonRB(out, tc, tcPath, index);

    String testStoryConfigId = null;
    if (tc.getTestStoryConfigId() != null) {
      testStoryConfigId = tc.getTestStoryConfigId();
    } else {
      testStoryConfigId = tp.getGlobalTestCaseConfigId();
    }

    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }

    this.generateTestStoryRB(out, tc.getTestStoryContent(), testStoryConfiguration, tcPath, tp,
        "ng-tab-html");
    this.generateTestStoryRB(out, tc.getTestStoryContent(), testStoryConfiguration, tcPath, tp,
        "plain");

    for (int i = 0; i < tc.getTeststeps().size(); i++) {
      TestStep child = tc.getTeststeps().get(i);
      generateTestPlanRBTestStep(out, child, tcPath, tp, testStoryConfigurationService, i + 1, profileService, tc.getName());
    }
  }

  private void generateTestPlanRBTestStep(ZipOutputStream out, TestStep ts, String path,
      TestPlan tp, TestStoryConfigurationService testStoryConfigurationService, int index, ProfileService profileService, String testCaseName) throws Exception {
    String stepPath = path + File.separator + "TestStep_" + index;

    String testStoryConfigId = null;
    if (ts.getTestStoryConfigId() != null) {
      testStoryConfigId = ts.getTestStoryConfigId();
    } else {
      if (ts.isManualTS()) {
        testStoryConfigId = tp.getGlobalManualTestStepConfigId();
      } else {
        testStoryConfigId = tp.getGlobalAutoTestStepConfigId();
      }
    }
    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }

    this.generateTestStoryRB(out, ts.getTestStoryContent(), testStoryConfiguration, stepPath, tp, "ng-tab-html");
    this.generateTestStoryRB(out, ts.getTestStoryContent(), testStoryConfiguration, stepPath, tp, "plain");

    this.generateTestStepJsonRB(out, ts, tp, stepPath, index, profileService);

    if (ts.getConformanceProfileId() != null && !ts.getConformanceProfileId().equals("")) {
      this.generateEr7Message(out, ts.getEr7Message(), stepPath);
      
      TestStepSupplementsParams params = new TestStepSupplementsParams();
      params.setConformanceProfileId(ts.getConformanceProfileId());
      params.setEr7Message(ts.getEr7Message());
      params.setIntegrationProfileId(ts.getIntegrationProfileId());
      params.setTestCaseName(testCaseName);
      params.setJdXSL(ts.getJdXSL());
      params.setTdsXSL(ts.getTdsXSL());
      params.setTestDataCategorizationMap(ts.getTestDataCategorizationMap());
      params.setFieldOrderIndifferentInfoMap(ts.getFieldOrderIndifferentInfoMap());
      params.setOrderIndifferentInfoMap(ts.getOrderIndifferentInfoMap());
      
      ConstraintXMLOutPut constraintXMLOutPut = new GenerationUtil().getConstraintsXML(params, profileService.findOne(params.getIntegrationProfileId()));
      if(constraintXMLOutPut != null && constraintXMLOutPut.getXmlStr() != null) this.generateConstraintsXML(out, constraintXMLOutPut.getXmlStr(), stepPath);
      
      TestStepSupplementXMLsOutput testStepSupplementXMLsOutput = new GenerationUtil().getSupplementXMLs(params, profileService.findOne(params.getIntegrationProfileId()));
      
      if(testStepSupplementXMLsOutput != null) {
        if(testStepSupplementXMLsOutput.getNistXMLStr() != null) {
          if (ts.getTdsXSL() != null && !ts.getTdsXSL().equals("")) {
            this.generateTestDataSpecification(out, testStepSupplementXMLsOutput.getNistXMLStr(), ts.getTdsXSL(), stepPath, "ng-tab-html");
            this.generateTestDataSpecification(out, testStepSupplementXMLsOutput.getNistXMLStr(), ts.getTdsXSL(), stepPath, "plain");
          }
          if (ts.getJdXSL() != null && !ts.getJdXSL().equals("")) {
            this.generateJurorDocument(out, ts.getJdXSL(), testStepSupplementXMLsOutput.getNistXMLStr(), stepPath, "ng-tab-html");
            this.generateJurorDocument(out, ts.getJdXSL(), testStepSupplementXMLsOutput.getNistXMLStr(), stepPath, "plain");
          }
        }
        if(testStepSupplementXMLsOutput.getMessageContentsXMLStr() != null) {
          this.generateMessageContent(out, testStepSupplementXMLsOutput.getMessageContentsXMLStr(), stepPath, "ng-tab-html");
          this.generateMessageContent(out, testStepSupplementXMLsOutput.getMessageContentsXMLStr(), stepPath, "plain");          
        }
      }
    }

  }

  private void generateTestPlanRB(ZipOutputStream out, TestPlan tp, TestStoryConfigurationService testStoryConfigurationService, ProfileService profileService, String rootPath) throws Exception {
    this.generateTestPlanJsonRB(out, tp, 1, rootPath);
    String testStoryConfigId = null;
    if (tp.getTestStoryConfigId() != null) {
      testStoryConfigId = tp.getTestStoryConfigId();
    }

    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }
    
    this.generateTestStoryRB(out, tp.getTestStoryContent(), testStoryConfiguration, rootPath, tp, "ng-tab-html");
    this.generateTestStoryRB(out, tp.getTestStoryContent(), testStoryConfiguration, rootPath, tp, "plain");

    for (int i = 0; i < tp.getChildren().size(); i++) {
      Object child = tp.getChildren().get(i);
      if (child instanceof TestCaseGroup) {
        generateTestPlanRBTestGroup(out, (TestCaseGroup) child, rootPath, tp, testStoryConfigurationService, i + 1, profileService);
      } else if (child instanceof TestCase) {
        generateTestPlanRBTestCase(out, (TestCase) child, rootPath, tp, testStoryConfigurationService, i + 1, profileService);
      }
    }
  }

  private void generateJurorDocument(ZipOutputStream out, String jdXSL, String nistXMLStr, String teststepPath, String option) throws IOException {
    ClassLoader classLoader = getClass().getClassLoader();
    InputStream is =
        classLoader.getResourceAsStream("xsl" + File.separator + jdXSL + ".xsl");
    String mcXSL = null;
    if (is != null) {
      byte[] buf = new byte[1024];

      if (option.equals("ng-tab-html")) {
        out.putNextEntry(new ZipEntry(teststepPath + File.separator + "JurorDocument.html"));
        mcXSL = IOUtils.toString(is);
      } else {
        out.putNextEntry(new ZipEntry(teststepPath + File.separator + "JurorDocumentPDF.html"));
        mcXSL =
            IOUtils.toString(is).replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
                "<xsl:param name=\"output\" select=\"'plain-html'\"/>");
      }

      InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
      InputStream sourceInputStream = new ByteArrayInputStream(nistXMLStr.getBytes());
      Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
      Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
      String xsltStr = IOUtils.toString(xsltReader);
      String sourceStr = IOUtils.toString(sourceReader);
      String jurorDocumentHTML = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
      InputStream inTP = null;
      inTP = IOUtils.toInputStream(jurorDocumentHTML);
      int lenTP;
      while ((lenTP = inTP.read(buf)) > 0) {
        out.write(buf, 0, lenTP);
      }
      out.closeEntry();
      inTP.close();
    }
  }

  private void generateTestDataSpecification(ZipOutputStream out, String nistXML, String tdXSL , String teststepPath,
      String option) throws IOException {
    ClassLoader classLoader = getClass().getClassLoader();
    InputStream is =
        classLoader.getResourceAsStream("xsl" + File.separator + tdXSL + ".xsl");
    String mcXSL = null;
    if (is != null) {
      byte[] buf = new byte[1024];

      if (option.equals("ng-tab-html")) {
        out.putNextEntry(
            new ZipEntry(teststepPath + File.separator + "TestDataSpecification.html"));
        mcXSL = IOUtils.toString(is);
      } else {
        out.putNextEntry(
            new ZipEntry(teststepPath + File.separator + "TestDataSpecificationPDF.html"));
        mcXSL =
            IOUtils.toString(is).replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
                "<xsl:param name=\"output\" select=\"'plain-html'\"/>");
      }

      InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
      InputStream sourceInputStream = new ByteArrayInputStream(nistXML.getBytes());
      Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
      Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
      String xsltStr = IOUtils.toString(xsltReader);
      String sourceStr = IOUtils.toString(sourceReader);
      String messageContentHTML = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
      InputStream inTP = null;
      inTP = IOUtils.toInputStream(messageContentHTML);
      int lenTP;
      while ((lenTP = inTP.read(buf)) > 0) {
        out.write(buf, 0, lenTP);
      }
      out.closeEntry();
      inTP.close();
    }
  }

  private void generateConstraintsXML(ZipOutputStream out, String constraintsXMLCode,
      String teststepPath) throws IOException {
    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry(teststepPath + File.separator + "Constraints.xml"));
    InputStream inTP = null;
    inTP = IOUtils.toInputStream(constraintsXMLCode);
    int lenTP;
    while ((lenTP = inTP.read(buf)) > 0) {
      out.write(buf, 0, lenTP);
    }
    out.closeEntry();
    inTP.close();
  }

  private void generateMessageContent(ZipOutputStream out, String messageContentsXMLCode,
      String teststepPath, String option) throws IOException {
    ClassLoader classLoader = getClass().getClassLoader();
    byte[] buf = new byte[1024];
    String mcXSL = null;
    if (option.equals("ng-tab-html")) {
      out.putNextEntry(new ZipEntry(teststepPath + File.separator + "MessageContent.html"));
      mcXSL = IOUtils.toString(
          classLoader.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl"));
    } else {
      out.putNextEntry(new ZipEntry(teststepPath + File.separator + "MessageContentPDF.html"));
      mcXSL = IOUtils
          .toString(classLoader.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl"))
          .replaceAll("<xsl:param name=\"output\" select=\"'ng-tab-html'\"/>",
              "<xsl:param name=\"output\" select=\"'plain-html'\"/>");
    }

    InputStream xsltInputStream = new ByteArrayInputStream(mcXSL.getBytes());
    InputStream sourceInputStream = new ByteArrayInputStream(messageContentsXMLCode.getBytes());
    Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
    Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");
    String xsltStr = IOUtils.toString(xsltReader);
    String sourceStr = IOUtils.toString(sourceReader);
    String messageContentHTML = XMLManager.parseXmlByXSLT(sourceStr, xsltStr);
    InputStream inTP = null;
    inTP = IOUtils.toInputStream(messageContentHTML);
    int lenTP;
    while ((lenTP = inTP.read(buf)) > 0) {
      out.write(buf, 0, lenTP);
    }
    out.closeEntry();
    inTP.close();

  }

  private void generateEr7Message(ZipOutputStream out, String er7Message, String teststepPath)
      throws IOException {
    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry(teststepPath + File.separator + "Message.txt"));

    InputStream inTP = null;
    inTP = IOUtils.toInputStream(er7Message);
    int lenTP;
    while ((lenTP = inTP.read(buf)) > 0) {
      out.write(buf, 0, lenTP);
    }
    out.closeEntry();
    inTP.close();

  }
  
 
  private long generateRandId() {
    long range = Long.MAX_VALUE;
    Random r = new Random();
    return r.nextLong() * range;
  }

  private void generateTestStepJsonRB(ZipOutputStream out, TestStep ts, TestPlan tp, String teststepPath, int index, ProfileService profileService) throws IOException {
    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry(teststepPath + File.separator + "TestStep.json"));
    InputStream inTP = null;
    JSONObject obj = new JSONObject();
    
    obj.put("id", this.generateRandId());
    obj.put("name", ts.getName());
    obj.put("description", ts.getDescription());
    obj.put("position", index);
    if (ts.getType() == null) {
      if (tp.getType() != null && tp.getType().equals("Isolated")) {
        obj.put("type", "SUT_INITIATOR");
      } else {
        obj.put("type", "DATAINSTANCE");
      }
    } else {
      if (ts.getType().equals("teststep")) {
        if (tp.getType() != null && tp.getType().equals("Isolated")) {
          obj.put("type", "SUT_INITIATOR");
        } else {
          obj.put("type", "DATAINSTANCE");
        }
      } else {
        obj.put("type", ts.getType());
      }
    }
    
    if(ts.getIntegrationProfileId() != null && ts.getConformanceProfileId() != null) {
      JSONArray plist = new JSONArray();
      plist.put("soap");
      obj.put("protocols", plist);
      
      ProfileData pd = profileService.findOne(ts.getIntegrationProfileId());
      
      JSONObject hl7v2Obj = new JSONObject();
      hl7v2Obj.put("messageId", ts.getConformanceProfileId());
      hl7v2Obj.put("constraintId", pd.getConformanceContext().getMetaData().getId());
      hl7v2Obj.put("valueSetLibraryId", pd.getValueSetLibrary().getMetaData().getId());
      obj.put("hl7v2", hl7v2Obj);
    }
    
    inTP = IOUtils.toInputStream(obj.toString());
    int lenTP;
    while ((lenTP = inTP.read(buf)) > 0) {
      out.write(buf, 0, lenTP);
    }
    out.closeEntry();
    inTP.close();
  }

  private void generateTestStoryRB(ZipOutputStream out, HashMap<String, String> testStoryContent,
      TestStoryConfiguration testStoryConfiguration, String path, TestPlan tp, String option)
      throws Exception {
    byte[] buf = new byte[1024];
    if (path == null) {
      if (option.equals("ng-tab-html")) {
        out.putNextEntry(new ZipEntry("Contextbased" + File.separator + tp.getName() + File.separator + "TestStory.html"));
      } else {
        out.putNextEntry(new ZipEntry("Contextbased" + File.separator + tp.getName() + File.separator + "TestStoryPDF.html"));
      }
    } else {
      if (option.equals("ng-tab-html")) {
        out.putNextEntry(new ZipEntry(path + File.separator + "TestStory.html"));
      } else {
        out.putNextEntry(new ZipEntry(path + File.separator + "TestStoryPDF.html"));
      }
    }

    String testStoryStr =
        this.generateTestStory(testStoryContent, testStoryConfiguration, option, tp);
    InputStream inTestStory = IOUtils.toInputStream(testStoryStr, "UTF-8");
    int lenTestStory;
    while ((lenTestStory = inTestStory.read(buf)) > 0) {
      out.write(buf, 0, lenTestStory);
    }
    inTestStory.close();
    out.closeEntry();
  }

  private void generateTestCaseJsonRB(ZipOutputStream out, TestCase tc, String testcasePath,
      int index) throws IOException {
    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry(testcasePath + File.separator + "TestCase.json"));

    JSONObject obj = new JSONObject();
    obj.put("id", this.generateRandId());
    obj.put("name", tc.getName());
    obj.put("description", tc.getDescription());
    obj.put("position", index);
    obj.put("protocol", tc.getProtocol());

    InputStream inTP = IOUtils.toInputStream(obj.toString());
    int lenTP;
    while ((lenTP = inTP.read(buf)) > 0) {
      out.write(buf, 0, lenTP);
    }
    out.closeEntry();
    inTP.close();
  }

  private void generateTestGroupJsonRB(ZipOutputStream out, TestCaseGroup tg, String groupPath,
      int index) throws IOException {
    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry(groupPath + File.separator + "TestCaseGroup.json"));

    JSONObject obj = new JSONObject();
    obj.put("id", this.generateRandId());
    obj.put("name", tg.getName());
    obj.put("description", tg.getDescription());
    obj.put("position", index);

    InputStream inTP = IOUtils.toInputStream(obj.toString());
    int lenTP;
    while ((lenTP = inTP.read(buf)) > 0) {
      out.write(buf, 0, lenTP);
    }
    out.closeEntry();
    inTP.close();
  }

  private void generateTestPlanJsonRB(ZipOutputStream out, TestPlan tp, int index, String rootPath)
      throws IOException {
    JSONObject obj = new JSONObject();
    obj.put("id", this.generateRandId());
    obj.put("name", tp.getName());
    obj.put("description", tp.getDescription());
    obj.put("position", index);
    obj.put("type", tp.getType());
    obj.put("transport", tp.isTransport());
    if (tp.getDomain() == null) {
      obj.put("domain", "NoDomain");
    } else {
      obj.put("domain", tp.getDomain());
    }
    obj.put("skip", false);

    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry(rootPath + File.separator + "TestPlan.json"));
    InputStream inTP = IOUtils.toInputStream(obj.toString());
    int lenTP;
    while ((lenTP = inTP.read(buf)) > 0) {
      out.write(buf, 0, lenTP);
    }
    out.closeEntry();
    inTP.close();
  }

  private String generateTestPlanSummaryForTestGroup(String contentsHTML, TestCaseGroup group,
      TestPlan tp, TestStoryConfigurationService testStoryConfigurationService) {
    contentsHTML = contentsHTML + "<h2>Test Case Group: " + group.getName() + "</h2>"
        + System.getProperty("line.separator");

    String testStoryConfigId = null;
    if (group.getTestStoryConfigId() != null) {
      testStoryConfigId = group.getTestStoryConfigId();
    } else {
      testStoryConfigId = tp.getGlobalTestGroupConfigId();
    }
    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }
    HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
    for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
      testStroyEntryMap.put(tse.getPosition(), tse);
    }

    String summaryContent = "";

    for (int i = 0; i < testStroyEntryMap.size(); i++) {
      TestStroyEntry tse = testStroyEntryMap.get(i + 1);

      if (tse.isSummaryEntry()) {
        String title = tse.getTitle();
        String content = group.getTestStoryContent().get(tse.getId());

        if (tp.isEmptyStoryContentIgnored()) {
          if (content != null && !"".equals(content))
            summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
        } else {
          summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
        }
      }
    }

    if (!summaryContent.equals("")) {
      contentsHTML = contentsHTML + summaryContent + System.getProperty("line.separator");
    }

    contentsHTML = contentsHTML + group.getDescription() + System.getProperty("line.separator");
    contentsHTML = contentsHTML + "<br/>" + System.getProperty("line.separator");

    for (int i = 0; i < group.getChildren().size(); i++) {
      Object child = group.getChildren().get(i);

      if (child instanceof TestCaseGroup) {
        contentsHTML = generateTestPlanSummaryForTestGroup(contentsHTML, (TestCaseGroup) child, tp,
            testStoryConfigurationService);
      } else if (child instanceof TestCase) {
        contentsHTML = generateTestPlanSummaryForTestCase(contentsHTML, (TestCase) child, tp,
            testStoryConfigurationService);
      }
    }

    return contentsHTML;
  }

  private String generateTestPlanSummaryForTestCase(String contentsHTML, TestCase tc, TestPlan tp,
      TestStoryConfigurationService testStoryConfigurationService) {
    contentsHTML = contentsHTML + "<table>" + System.getProperty("line.separator");

    contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
    contentsHTML = contentsHTML + "<th>Test Case</th>" + System.getProperty("line.separator");
    contentsHTML =
        contentsHTML + "<th>" + tc.getName() + "</th>" + System.getProperty("line.separator");
    contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

    contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");

    String testStoryConfigId = null;
    if (tc.getTestStoryConfigId() != null) {
      testStoryConfigId = tc.getTestStoryConfigId();
    } else {
      testStoryConfigId = tp.getGlobalTestCaseConfigId();
    }

    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }

    HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
    for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
      testStroyEntryMap.put(tse.getPosition(), tse);
    }

    String summaryContent = "";

    for (int i = 0; i < testStroyEntryMap.size(); i++) {
      TestStroyEntry tse = testStroyEntryMap.get(i + 1);

      if (tse.isSummaryEntry()) {
        String title = tse.getTitle();
        String content = tc.getTestStoryContent().get(tse.getId());

        if (tp.isEmptyStoryContentIgnored()) {
          if (content != null && !"".equals(content))
            summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
        } else {
          summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
        }
      }
    }

    if (!summaryContent.equals("")) {
      contentsHTML = contentsHTML + "<td colspan='2'>" + summaryContent + "</td>"
          + System.getProperty("line.separator");
    }
    contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

    contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
    contentsHTML =
        contentsHTML + "<th colspan='2'>Test Steps</th>" + System.getProperty("line.separator");
    contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

    for (int i = 0; i < tc.getTeststeps().size(); i++) {
      TestStep ts = tc.getTeststeps().get(i);
      contentsHTML =
          generateTestPlanSummaryForTestStep(contentsHTML, ts, tp, testStoryConfigurationService);

    }

    contentsHTML = contentsHTML + "</table>" + System.getProperty("line.separator");
    contentsHTML = contentsHTML + "<br/>" + System.getProperty("line.separator");

    return contentsHTML;
  }

  private String generateTestPlanSummaryForTestStep(String contentsHTML, TestStep ts, TestPlan tp,
      TestStoryConfigurationService testStoryConfigurationService) {
    contentsHTML = contentsHTML + "<tr>" + System.getProperty("line.separator");
    contentsHTML =
        contentsHTML + "<th>" + ts.getName() + "</th>" + System.getProperty("line.separator");

    String testStoryConfigId = null;
    if (ts.getTestStoryConfigId() != null) {
      testStoryConfigId = ts.getTestStoryConfigId();
    } else {
      if (ts.isManualTS()) {
        testStoryConfigId = tp.getGlobalManualTestStepConfigId();
      } else {
        testStoryConfigId = tp.getGlobalAutoTestStepConfigId();
      }
    }
    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }
    HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
    for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
      testStroyEntryMap.put(tse.getPosition(), tse);
    }

    String summaryContent = "";

    for (int i = 0; i < testStroyEntryMap.size(); i++) {
      TestStroyEntry tse = testStroyEntryMap.get(i + 1);

      if (tse.isSummaryEntry()) {
        String title = tse.getTitle();
        String content = ts.getTestStoryContent().get(tse.getId());

        if (tp.isEmptyStoryContentIgnored()) {
          if (content != null && !"".equals(content))
            summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
        } else {
          summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
        }
      }
    }

    if (!summaryContent.equals("")) {
      contentsHTML =
          contentsHTML + "<td>" + summaryContent + "</td>" + System.getProperty("line.separator");
    }

    contentsHTML = contentsHTML + "</tr>" + System.getProperty("line.separator");

    return contentsHTML;
  }

  private void generateTestPlanSummary(ZipOutputStream out, TestPlan tp,
      TestStoryConfigurationService testStoryConfigurationService, String rootPath) throws IOException {
    ClassLoader classLoader = getClass().getClassLoader();
    String testPlanSummaryStr = IOUtils
        .toString(classLoader.getResourceAsStream("rb" + File.separator + "TestPlanSummary.html"));
    testPlanSummaryStr = testPlanSummaryStr.replace("?TestPlanName?", tp.getName());

    String contentsHTML = "";

    String testStoryConfigId = null;
    if (tp.getTestStoryConfigId() != null) {
      testStoryConfigId = tp.getTestStoryConfigId();
    }
    TestStoryConfiguration testStoryConfiguration = null;
    if (testStoryConfigId != null) {
      testStoryConfiguration = testStoryConfigurationService.findById(testStoryConfigId);
    }

    if (testStoryConfiguration == null) {
      testStoryConfiguration = testStoryConfigurationService.findByAccountId((long) 0).get(0);
    }
    HashMap<Integer, TestStroyEntry> testStroyEntryMap = new HashMap<Integer, TestStroyEntry>();
    for (TestStroyEntry tse : testStoryConfiguration.getTestStoryConfig()) {
      testStroyEntryMap.put(tse.getPosition(), tse);
    }

    String summaryContent = "";

    for (int i = 0; i < testStroyEntryMap.size(); i++) {
      TestStroyEntry tse = testStroyEntryMap.get(i + 1);

      if (tse.isSummaryEntry()) {
        String title = tse.getTitle();
        String content = tp.getTestStoryContent().get(tse.getId());
        if (tp.isEmptyStoryContentIgnored()) {
          if (content != null && !"".equals(content))
            summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
        } else {
          summaryContent = summaryContent + "<h3>" + title + "</h3>" + content + "<br/>";
        }
      }
    }

    if (!summaryContent.equals("")) {
      contentsHTML = contentsHTML + summaryContent + System.getProperty("line.separator");
    }

    for (int i = 0; i < tp.getChildren().size(); i++) {
      Object child = tp.getChildren().get(i);
      if (child instanceof TestCaseGroup) {
        TestCaseGroup group = (TestCaseGroup) child;
        contentsHTML = generateTestPlanSummaryForTestGroup(contentsHTML, group, tp,
            testStoryConfigurationService);
      } else if (child instanceof TestCase) {
        TestCase tc = (TestCase) child;
        contentsHTML =
            generateTestPlanSummaryForTestCase(contentsHTML, tc, tp, testStoryConfigurationService);
      }
    }
    testPlanSummaryStr = testPlanSummaryStr.replace("?contentsHTML?", contentsHTML);

    byte[] buf = new byte[1024];
    out.putNextEntry(new ZipEntry(rootPath + File.separator + "TestPlanSummary.html"));
    InputStream inTestPlanSummary = IOUtils.toInputStream(testPlanSummaryStr);
    int lenTestPlanSummary;
    while ((lenTestPlanSummary = inTestPlanSummary.read(buf)) > 0) {
      out.write(buf, 0, lenTestPlanSummary);
    }
    out.closeEntry();
    inTestPlanSummary.close();
  }

  public InputStream exportProfileXMLZip(Set<String> keySet, ProfileService profileService,
      Long rand) throws IOException {

    ByteArrayOutputStream outputStream = null;
    byte[] bytes;
    outputStream = new ByteArrayOutputStream();
    ZipOutputStream out = new ZipOutputStream(outputStream);

    for (String id : keySet) {
      if (id != null && !id.isEmpty()) {
        this.generateProfileXML(out, id, profileService);
      }
    }
    out.close();
    bytes = outputStream.toByteArray();
    return new ByteArrayInputStream(bytes);
  }

  public InputStream[] exportProfileXMLArrayZip(String id, ProfileService profileService)
      throws IOException {
    ByteArrayOutputStream outputStream0 = null;
    ByteArrayOutputStream outputStream1 = null;
    ByteArrayOutputStream outputStream2 = null;

    byte[] bytes0;
    byte[] bytes1;
    byte[] bytes2;

    outputStream0 = new ByteArrayOutputStream();
    outputStream1 = new ByteArrayOutputStream();
    outputStream2 = new ByteArrayOutputStream();

    ZipOutputStream out0 = new ZipOutputStream(outputStream0);
    ZipOutputStream out1 = new ZipOutputStream(outputStream1);
    ZipOutputStream out2 = new ZipOutputStream(outputStream2);

    this.generateProfileXML(out0, out1, out2, id, profileService);

    out0.close();
    out1.close();
    out2.close();

    bytes0 = outputStream0.toByteArray();
    bytes1 = outputStream1.toByteArray();
    bytes2 = outputStream2.toByteArray();

    InputStream[] results = new InputStream[3];
    results[0] = new ByteArrayInputStream(bytes0);
    results[1] = new ByteArrayInputStream(bytes1);
    results[2] = new ByteArrayInputStream(bytes2);

    return results;
  }
  

  private void generateProfileXML(ZipOutputStream out0, ZipOutputStream out1, ZipOutputStream out2,
      String id, ProfileService profileService) throws IOException {
    ProfileData tcamtProfile = profileService.findOne(id);

    if (tcamtProfile != null) {
      byte[] buf = new byte[1024];
      out0.putNextEntry(new ZipEntry("Profile.xml"));
      InputStream inTP = null;
      String profileStr = tcamtProfile.getProfileXMLFileStr();
      inTP = IOUtils.toInputStream(profileStr);
      int lenTP;
      while ((lenTP = inTP.read(buf)) > 0) {
        out0.write(buf, 0, lenTP);
      }
      out0.closeEntry();
      inTP.close();

      out1.putNextEntry(new ZipEntry("ValueSet.xml"));
      inTP = null;
      String tableStr = tcamtProfile.getValueSetXMLFileStr();
      inTP = IOUtils.toInputStream(tableStr);
      lenTP = 0;
      while ((lenTP = inTP.read(buf)) > 0) {
        out1.write(buf, 0, lenTP);
      }
      out1.closeEntry();
      inTP.close();

      out2.putNextEntry(new ZipEntry("Constraints.xml"));
      inTP = null;
      String constraintStr = tcamtProfile.getConstraintsXMLFileStr();
      inTP = IOUtils.toInputStream(constraintStr);
      lenTP = 0;
      while ((lenTP = inTP.read(buf)) > 0) {
        out2.write(buf, 0, lenTP);
      }
      out2.closeEntry();
      inTP.close();
    }

  }

  private void generateProfileXML(ZipOutputStream out, String id, ProfileService profileService) throws IOException {
    ProfileData profileData = profileService.findOne(id);

    if (profileData != null) {
      byte[] buf = new byte[1024];
      out.putNextEntry(new ZipEntry(
          "Global" + File.separator + "Profiles" + File.separator + id + "_Profile.xml"));
      InputStream inTP = null;
      inTP = IOUtils.toInputStream(profileData.getProfileXMLFileStr());
      int lenTP;
      while ((lenTP = inTP.read(buf)) > 0) {
        out.write(buf, 0, lenTP);
      }
      out.closeEntry();
      inTP.close();

      out.putNextEntry(new ZipEntry(
          "Global" + File.separator + "Tables" + File.separator + id + "_ValueSet.xml"));
      inTP = null;
      inTP =
          IOUtils.toInputStream(profileData.getValueSetXMLFileStr());
      lenTP = 0;
      while ((lenTP = inTP.read(buf)) > 0) {
        out.write(buf, 0, lenTP);
      }
      out.closeEntry();
      inTP.close();

      out.putNextEntry(new ZipEntry(
          "Global" + File.separator + "Constraints" + File.separator + id + "_Constraints.xml"));
      inTP = null;
      inTP = IOUtils.toInputStream(profileData.getConstraintsXMLFileStr());
      lenTP = 0;
      while ((lenTP = inTP.read(buf)) > 0) {
        out.write(buf, 0, lenTP);
      }
      out.closeEntry();
      inTP.close();
    }
  }
  
  public String[] generateProfileXML(String id, ProfileService profileService) {
    ProfileData tcamtProfile = profileService.findOne(id);

    if (tcamtProfile != null) {
      String[] result = new String[3];
      result[0] = tcamtProfile.getProfileXMLFileStr();
      result[1] = tcamtProfile.getValueSetXMLFileStr();
      result[2] = tcamtProfile.getConstraintsXMLFileStr();
      return result;
    }
    return null;
  }

}
