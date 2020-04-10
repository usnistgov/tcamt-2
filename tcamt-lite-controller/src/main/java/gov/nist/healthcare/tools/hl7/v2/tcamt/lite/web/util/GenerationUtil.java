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
package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.util;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringWriter;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import org.apache.commons.io.IOUtils;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.RequestBody;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.w3c.dom.Text;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Categorization;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Operation;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.OrderIndifferentInfo;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TriggerInfo;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TriggerPath;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal.ComponentNode;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal.FieldNode;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal.SegmentInfo;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal.SegmentNode;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.internal.SubComponentNode;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Component;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ConformanceProfile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Datatype;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Field;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Group;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.IntegrationProfile;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Predicate;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ProfileData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Segment;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.SegmentRef;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.SegmentRefOrGroup;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.Usage;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.ConstraintParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.SegmentInstanceData;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.SegmentParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepSupplementXMLsOutput;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepSupplementsOutput;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepSupplementsParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepXMLOutput;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.view.TestStepXMLParams;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.util.XMLManager;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller.ConstraintXMLOutPut;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller.DynamicInfo;

/**
 * @author jungyubw
 *
 */
public class GenerationUtil {
  private List<SegmentInfo> segmentsInfoList = new ArrayList<SegmentInfo>();
  private int repeatedNum = 1;
  private int currentPosition = 0;
  
  final String OLD_FORMAT = "yyyyMMdd";
  final String NEW_FORMAT = "MM/dd/yyyy";

  public List<SegmentInstanceData> popSegmentList(TestStepParams params, ProfileData profileData) {
    this.segmentsInfoList = new ArrayList<SegmentInfo>();
    this.repeatedNum = 1;
    this.currentPosition = 0;

    if (params.getIntegrationProfileId() != null) {
      if (profileData != null && profileData.getIntegrationProfile() != null && params.getConformanceProfileId() != null) {

        ConformanceProfile cp = profileData.getIntegrationProfile().findConformanceProfileById(params.getConformanceProfileId());
        if (cp != null && params.getEr7Message() != null && params.getEr7Message().startsWith("MSH")) {

          List<SegmentInstanceData> segmentInstanceDataList = new ArrayList<SegmentInstanceData>();
          Map<String, Integer> segmantCountMap = new HashMap<String, Integer>();
          String[] listLineOfMessage = params.getEr7Message().split("\n");
          int lineNum = 0;

          for (String line : listLineOfMessage) {
            lineNum = lineNum + 1;
            SegmentInstanceData segmentInstanceData = new SegmentInstanceData();
            segmentInstanceData.setLineStr(line);
            segmentInstanceData.setSegmentName(line.substring(0, 3));
            segmentInstanceData.setLineNum(lineNum);
            segmentInstanceDataList.add(segmentInstanceData);

            if (segmantCountMap.containsKey(segmentInstanceData.getSegmentName())) {
              segmantCountMap.put(segmentInstanceData.getSegmentName(), segmantCountMap.get(segmentInstanceData.getSegmentName()) + 1);
            } else {
              segmantCountMap.put(segmentInstanceData.getSegmentName(), 1);
            }
          }

          for (String key : segmantCountMap.keySet()) {
            if (repeatedNum < segmantCountMap.get(key))
              repeatedNum = segmantCountMap.get(key);
          }

          segmentsInfoList = new ArrayList<SegmentInfo>();
          int index = 0;
          for (SegmentRefOrGroup srog : cp.getChildren()) {
            index = index + 1;
            if(index == 1){
              this.analyzeSegmentRefOrGroup(srog, index, "", "", "", "", "", true, profileData);
            }else {
              this.analyzeSegmentRefOrGroup(srog, index, "", "", "", "", "", false, profileData);  
            }
            
          }
          
//          for(SegmentInfo si:segmentsInfoList){
//            System.out.println(si);
//          }
          
          currentPosition = 0;

          for (SegmentInstanceData sid : segmentInstanceDataList) {
            SegmentInfo sInfo = this.findSegmentInfo(sid.getSegmentName(), null);
            if (sInfo != null) {
//              System.out.println(sid);
//              System.out.println(currentPosition);
              sid.setiPath(sInfo.getiPath());
              sid.setPath(sInfo.getPath());
              sid.setPositionIPath(sInfo.getiPositionPath());
              sid.setPositionPath(sInfo.getPositionPath());
              sid.setSegmentDef(sInfo.getSegment());
              sid.setUsagePath(sInfo.getUsagePath());
            }else {
//              System.out.println("NULL FOUND");
//              System.out.println(sid);
//              System.out.println(currentPosition);
            }
          }

          return segmentInstanceDataList;
        }
      }
    }

    return null;
  }

  public SegmentNode popSegmentNode(SegmentParams params, ProfileData profileData) {
    SegmentNode segmentNode = new SegmentNode();
    if (params.getIntegrationProfileId() != null) {
      if (profileData != null && profileData.getIntegrationProfile() != null
          && params.getConformanceProfileId() != null && params.getSegmentId() != null) {
        Segment s = profileData.getIntegrationProfile().findSegemntById(params.getSegmentId());
        if (s != null && params.getLineStr() != null
            && params.getLineStr().startsWith(s.getName())) {
          segmentNode.setSegmentName(s.getName());
          segmentNode.setiPath(params.getiPath());
          segmentNode.setiPositionPath(params.getiPositionPath());
          segmentNode.setPath(params.getPath());
          segmentNode.setPostionPath(params.getPositionPath());
          segmentNode.setSegmentId(params.getSegmentId());
          segmentNode.setSegmentStr(params.getLineStr());
          segmentNode.setChildren(this.popFields(s, segmentNode.getSegmentStr(), params,
              this.findDynamicInfo(s, params.getLineStr()), profileData));
          return segmentNode;
        }
      }
    }
    return null;
  }

  public TestStepXMLOutput getXMLs(TestStepXMLParams params, ProfileData profileData)
      throws Exception {
    if (profileData != null && profileData.getIntegrationProfile() != null) {
      ConformanceProfile cp = profileData.getIntegrationProfile()
          .findConformanceProfileById(params.getConformanceProfileId());

      if (cp != null) {
        String rootName = cp.getConformanceProfileMetaData().getStructId();
        String xmlString = '<' + rootName + " testcaseName=\"" + params.getTestCaseName() + "\">"
            + "</" + rootName + ">";

        Document stdXMLDoc = XMLManager.stringToDom(xmlString);
        Element rootSTDElm = (Element) stdXMLDoc.getElementsByTagName(rootName).item(0);
        Document nistXMLDoc = XMLManager.stringToDom(xmlString);
        Element rootNISTElm = (Element) nistXMLDoc.getElementsByTagName(rootName).item(0);

        TestStepParams testStepParams = new TestStepParams();
        testStepParams.setConformanceProfileId(params.getConformanceProfileId());
        testStepParams.setEr7Message(params.getEr7Message());
        testStepParams.setIntegrationProfileId(params.getIntegrationProfileId());
        List<SegmentInstanceData> segmentList = this.popSegmentList(testStepParams, profileData);

        if (segmentList != null) {
          for (SegmentInstanceData segment : segmentList) {
            String[] iPathList = segment.getiPath().split("\\.");
            if (iPathList.length == 1) {
              Element segmentSTDElm =
                  stdXMLDoc.createElement(iPathList[0].substring(0, iPathList[0].lastIndexOf("[")));
              Element segmentNISTElm = nistXMLDoc
                  .createElement(iPathList[0].substring(0, iPathList[0].lastIndexOf("[")));

              this.generateSTDSegment(segmentSTDElm, segment, stdXMLDoc,
                  profileData.getIntegrationProfile());
              this.generateNISTSegment(segmentNISTElm, segment, nistXMLDoc,
                  profileData.getIntegrationProfile());

              rootSTDElm.appendChild(segmentSTDElm);
              rootNISTElm.appendChild(segmentNISTElm);
            } else {
              Element parentSTDElm = rootSTDElm;
              Element parentNISTElm = rootNISTElm;

              for (int i = 0; i < iPathList.length; i++) {
                String iPath = iPathList[i];
                if (i == iPathList.length - 1) {
                  Element segmentSTDElm =
                      stdXMLDoc.createElement(iPath.substring(0, iPath.lastIndexOf("[")));
                  Element segmentNISTElm =
                      nistXMLDoc.createElement(iPath.substring(0, iPath.lastIndexOf("[")));
                  this.generateSTDSegment(segmentSTDElm, segment, stdXMLDoc,
                      profileData.getIntegrationProfile());
                  this.generateNISTSegment(segmentNISTElm, segment, nistXMLDoc,
                      profileData.getIntegrationProfile());

                  parentSTDElm.appendChild(segmentSTDElm);
                  parentNISTElm.appendChild(segmentNISTElm);
                } else {
                  String groupName = iPath.substring(0, iPath.lastIndexOf("["));
                  int groupIndex = Integer.parseInt(
                      iPath.substring(iPath.lastIndexOf("[") + 1, iPath.lastIndexOf("]")));

                  NodeList nodeListSTDgroups =
                      parentSTDElm.getElementsByTagName(rootName + "." + groupName);
                  NodeList nodeListNISTgroups =
                      parentNISTElm.getElementsByTagName(rootName + "." + groupName);

                  if (nodeListSTDgroups == null || nodeListSTDgroups.getLength() < groupIndex) {
                    Element groupSTDElm = stdXMLDoc.createElement(rootName + "." + groupName);
                    parentSTDElm.appendChild(groupSTDElm);
                    parentSTDElm = groupSTDElm;

                  } else {
                    parentSTDElm = (Element) nodeListSTDgroups.item(groupIndex - 1);
                  }

                  if (nodeListNISTgroups == null || nodeListNISTgroups.getLength() < groupIndex) {
                    Element groupNISTElm = nistXMLDoc.createElement(rootName + "." + groupName);
                    parentNISTElm.appendChild(groupNISTElm);
                    parentNISTElm = groupNISTElm;

                  } else {
                    parentNISTElm = (Element) nodeListNISTgroups.item(groupIndex - 1);
                  }
                }
              }
            }
          }

          TestStepXMLOutput testStepXMLOutput = new TestStepXMLOutput();
          testStepXMLOutput.setNistXML(XMLManager.docToString(nistXMLDoc));
          testStepXMLOutput.setStdXML(XMLManager.docToString(stdXMLDoc));

          return testStepXMLOutput;
        }
      }
    }
    return null;
  }

  public TestStepSupplementsOutput getSupplements(TestStepSupplementsParams params,
      ProfileData profileData) throws Exception {
    TestStepSupplementsOutput result = new TestStepSupplementsOutput();
    TestStepXMLParams testStepXMLParams = new TestStepXMLParams();
    testStepXMLParams.setConformanceProfileId(params.getConformanceProfileId());
    testStepXMLParams.setEr7Message(params.getEr7Message());
    testStepXMLParams.setIntegrationProfileId(params.getIntegrationProfileId());
    testStepXMLParams.setTestCaseName(params.getTestCaseName());

    String nistXMLStr = this.getXMLs(testStepXMLParams, profileData).getNistXML();
    ClassLoader classLoader = getClass().getClassLoader();

    if (params.getTdsXSL() != null && !params.getTdsXSL().equals("")) {
      String xslStr = IOUtils.toString(
          classLoader.getResourceAsStream("xsl" + File.separator + params.getTdsXSL() + ".xsl"));

      if (xslStr != null && nistXMLStr != null) {
        InputStream xsltInputStream = new ByteArrayInputStream(xslStr.getBytes());
        InputStream sourceInputStream = new ByteArrayInputStream(nistXMLStr.getBytes());

        Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
        Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");

        String xsltStr = IOUtils.toString(xsltReader);
        String sourceStr = IOUtils.toString(sourceReader);

        result.setTestdataSpecification(GenerationUtil.parseXmlByXSLT(sourceStr, xsltStr));
        result.setTestdataSpecification(
            result.getTestdataSpecification().replace("accordion", "uib-accordion"));
      }
    }

    if (params.getJdXSL() != null && !params.getJdXSL().equals("")) {
      if(params.getJdXSL().equals("IZ52-IZ33NF-IZ33TM-IZ33PD-JurorDocument")) {
        String testCaseName = params.getTestCaseName();
        Document nistXMLDom = XMLManager.stringToDom(nistXMLStr);
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
          result.setJurorDocument(jdTemplate);
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
          
          result.setJurorDocument(jdTemplate);
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
          
          result.setJurorDocument(jdTemplate);
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
          
          result.setJurorDocument(jdTemplate);
        }
      } else {
        String xslStr = IOUtils.toString(classLoader.getResourceAsStream("xsl" + File.separator + params.getJdXSL() + ".xsl"));

        if (xslStr != null && nistXMLStr != null) {
          InputStream xsltInputStream = new ByteArrayInputStream(xslStr.getBytes());
          InputStream sourceInputStream = new ByteArrayInputStream(nistXMLStr.getBytes());

          Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
          Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");

          String xsltStr = IOUtils.toString(xsltReader);
          String sourceStr = IOUtils.toString(sourceReader);

          result.setJurorDocument(GenerationUtil.parseXmlByXSLT(sourceStr, xsltStr));
          result.setJurorDocument(result.getJurorDocument().replace("accordion", "uib-accordion"));
        } 
      }
    }

    String mcXML = this.generateMessageContentXML(params, profileData);
    String xslStr = IOUtils
        .toString(classLoader.getResourceAsStream("xsl" + File.separator + "MessageContents.xsl"));

    if (xslStr != null && mcXML != null) {
      InputStream xsltInputStream = new ByteArrayInputStream(xslStr.getBytes());
      InputStream sourceInputStream = new ByteArrayInputStream(mcXML.getBytes());

      Reader xsltReader = new InputStreamReader(xsltInputStream, "UTF-8");
      Reader sourceReader = new InputStreamReader(sourceInputStream, "UTF-8");

      String xsltStr = IOUtils.toString(xsltReader);
      String sourceStr = IOUtils.toString(sourceReader);

      result.setMessageContent(GenerationUtil.parseXmlByXSLT(sourceStr, xsltStr));
      result.setMessageContent(result.getMessageContent().replace("accordion", "uib-accordion"));
    }

    return result;
  }

  /**
   * @param firstPatientName
   * @param middlePatientName
   * @param lastPatientName
   * @return
   */
  private String generateName(String firstPatientName, String middlePatientName,String lastPatientName) {
    if(middlePatientName == null || middlePatientName.equals("NOT_Found")) {
      return firstPatientName + " " + lastPatientName;
    }
    return firstPatientName + " " + middlePatientName + " " + lastPatientName;
  }

  /**
   * @param immunizationHistoryDateAdministered
   * @return
   */
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

  /**
   * @param nistXMLDom
   * @param string
   * @param string2
   * @param string3
   * @param string4
   * @param i
   * @return
   */
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

  /**
   * @param nistXMLDom
   * @param string
   * @return
   */
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
  
  /**
   * @param orderGroup
   * @param path
   * @return
   */
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

  public TestStepSupplementXMLsOutput getSupplementXMLs(
      @RequestBody TestStepSupplementsParams params, ProfileData profileData) throws Exception {
    TestStepSupplementXMLsOutput result = new TestStepSupplementXMLsOutput();
    TestStepXMLParams testStepXMLParams = new TestStepXMLParams();
    testStepXMLParams.setConformanceProfileId(params.getConformanceProfileId());
    testStepXMLParams.setEr7Message(params.getEr7Message());
    testStepXMLParams.setIntegrationProfileId(params.getIntegrationProfileId());
    testStepXMLParams.setTestCaseName(params.getTestCaseName());
    TestStepXMLOutput testStepXMLOutput = this.getXMLs(testStepXMLParams, profileData);
    if (testStepXMLOutput != null) {
      String nistXMLStr = testStepXMLOutput.getNistXML();
      String mcXML = this.generateMessageContentXML(params, profileData);

      result.setMessageContentsXMLStr(mcXML);
      result.setNistXMLStr(nistXMLStr);
      return result;
    }
    return null;


  }

  public ConstraintXMLOutPut getConstraintsXML(TestStepSupplementsParams params,
      ProfileData profileData) throws Exception {
    ConstraintXMLOutPut constraintXMLOutPut = new ConstraintXMLOutPut();
    String rootName = "ConformanceContext";
    String xmlString = "<" + rootName + ">" + "</" + rootName + ">";
    Document xmlDoc = XMLManager.stringToDom(xmlString);
    Element rootElement = (Element) xmlDoc.getElementsByTagName(rootName).item(0);
    rootElement.setAttribute("UUID", new ObjectId().toString());
    rootElement.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
    rootElement.setAttribute("xsi:noNamespaceSchemaLocation",
        "https://raw.githubusercontent.com/Jungyubw/NIST_healthcare_hl7_v2_profile_schema/master/Schema/NIST%20Validation%20Schema/ConformanceContext.xsd");

    Element elmMetaData = xmlDoc.createElement("MetaData");
    elmMetaData.setAttribute("Name", "Contextbased Constrations");
    elmMetaData.setAttribute("OrgName", "NIST");
    elmMetaData.setAttribute("Version", "No Version Info");
    elmMetaData.setAttribute("Date", new Date().toString());
    elmMetaData.setAttribute("Status", "Draft");

    rootElement.appendChild(elmMetaData);

    Element constraintsElement = xmlDoc.createElement("Constraints");
    Element orderIndifferentElement = xmlDoc.createElement("OrderIndifferent");
    Element messageElement = xmlDoc.createElement("Message");
    Element byIDElement = xmlDoc.createElement("ByID");
    byIDElement.setAttribute("ID", params.getConformanceProfileId());

    rootElement.appendChild(constraintsElement);
    rootElement.appendChild(orderIndifferentElement);
    constraintsElement.appendChild(messageElement);
    messageElement.appendChild(byIDElement);

    TestStepParams testStepParams = new TestStepParams();
    testStepParams.setConformanceProfileId(params.getConformanceProfileId());
    testStepParams.setEr7Message(params.getEr7Message());
    testStepParams.setIntegrationProfileId(params.getIntegrationProfileId());
    List<SegmentInstanceData> segmentList = this.popSegmentList(testStepParams, profileData);

    if (segmentList != null) {
      for (SegmentInstanceData instanceSegment : segmentList) {
        Segment segment = instanceSegment.getSegmentDef();
        String segName = instanceSegment.getSegmentName();
        String segmentiPath = instanceSegment.getiPath();
        String segmentiPositionPath = instanceSegment.getPositionIPath();
        String segUsagePath = instanceSegment.getUsagePath();        
        Element oiTargetElm = judgeOrderSpecificOrIndifferent(params.getOrderIndifferentInfoMap(),
            segmentiPositionPath, orderIndifferentElement, xmlDoc, segName, instanceSegment, segmentList);
        if (oiTargetElm == null)
          this.createOrderSpecificConstraints(byIDElement, segment, instanceSegment, xmlDoc,
              constraintXMLOutPut, segmentiPositionPath, segmentiPath, segName, profileData,
              segUsagePath, params);

        else {
          Element constraintsElm = (Element) ((Element) oiTargetElm.getParentNode())
              .getElementsByTagName("Constraints").item(0);
          this.createOrderIndifferntConstraints(constraintsElm, segment, instanceSegment, xmlDoc,
              constraintXMLOutPut, segmentiPositionPath, segmentiPath, segName, profileData,
              segUsagePath, params);
        }
      }
      this.normalizeXML(rootElement);
      constraintXMLOutPut.setXmlStr(XMLManager.docToString(xmlDoc));
      return constraintXMLOutPut;
    }
    return null;
  }


  /**
   * @param rootElement
   */
  private void normalizeXML(Element rootElement) {
    Element orderIndifferentElm =
        (Element) rootElement.getElementsByTagName("OrderIndifferent").item(0);

    NodeList allContexts = orderIndifferentElm.getElementsByTagName("Contexts");
    if (allContexts != null) {
      for (int i = 0; i < allContexts.getLength(); i++) {
        Element contextElm = (Element) allContexts.item(i);
        if (contextElm.getChildNodes() == null || contextElm.getChildNodes().getLength() == 0) {
          contextElm.getParentNode().removeChild(contextElm);
          i = i - 1;
        }
      }
    }


    NodeList allConstraints = orderIndifferentElm.getElementsByTagName("Constraints");
    if (allConstraints != null) {
      for (int i = 0; i < allConstraints.getLength(); i++) {
        Element constraintElm = (Element) allConstraints.item(i);
        if (constraintElm.getChildNodes() == null
            || constraintElm.getChildNodes().getLength() == 0) {
          Element patternElm = (Element) constraintElm.getParentNode();
          patternElm.removeChild(constraintElm);
          i = i - 1;
        }
      }
    }

    NodeList allContext = orderIndifferentElm.getElementsByTagName("Context");

    if (allContext != null) {
      for (int i = 0; i < allContext.getLength(); i++) {
        Element contextElm = (Element) allContext.item(i);
        if (contextElm.getChildNodes() == null || contextElm.getChildNodes().getLength() == 0) {
          contextElm.getParentNode().removeChild(contextElm);
          i = i - 1;
        }
      }
    }

    if (orderIndifferentElm.getChildNodes() == null
        || orderIndifferentElm.getChildNodes().getLength() == 0) {
      orderIndifferentElm.getParentNode().removeChild(orderIndifferentElm);
    }

    rootElement.getOwnerDocument().normalize();

  }

  /**
   * @param orderIndifferentInfoMap
   * @param segmentiPositionPath
   * @param xmlDoc
   */
  private Element judgeOrderSpecificOrIndifferent(
      HashMap<String, OrderIndifferentInfo> orderIndifferentInfoMap, String segmentiPositionPath,
      Element orderIndifferentElement, Document xmlDoc, String segmentName,
      SegmentInstanceData segmentInstanceData, List<SegmentInstanceData> segmentList) {
    Element currentElm = orderIndifferentElement;

    if (orderIndifferentInfoMap != null) {
      String[] positionPaths = segmentiPositionPath.split("\\.");
      String profilePath = "";
      String contextPath = "";
      String instancePath = "";
      for (String positionPath : positionPaths) {
        instancePath = instancePath + "." + positionPath;
        String profileCurrentPath = positionPath.substring(0, positionPath.indexOf("["));
        profilePath = profilePath + "-" + profileCurrentPath;
        

        OrderIndifferentInfo orderIndifferentInfo =
            orderIndifferentInfoMap.get(profilePath.substring(1));
        
        
        if (orderIndifferentInfo != null) {
          if (orderIndifferentInfo.isOrderSpecific()) {
            contextPath = contextPath + "." + profileCurrentPath + "[*]";
            currentElm = this.findContextPattern(currentElm, contextPath.substring(1), instancePath.substring(1), orderIndifferentInfo, segmentList);
          } else {
            contextPath = contextPath + "." + positionPath;
          }
        } else {
          contextPath = contextPath + "." + positionPath;
        }
      }
    }
    if (currentElm.getNodeName().equals("OrderIndifferent"))
      return null;
    else
      return currentElm;
  }

  /**
   * @param currentElm
   * @param orderIndifferentInfo
   * @param substring
   * @param substring2
   */
  private Element findContextPattern(Element currentElm, String contextPath, String instancePath,
      OrderIndifferentInfo orderIndifferentInfo, List<SegmentInstanceData> segmentList) {
    int startNum = 0;

    if (currentElm.getNodeName().equals("Contexts")) {
      startNum = ((Element) currentElm.getParentNode()).getAttribute("Ref").split("\\.").length;
    }


    for (int i = 0; i < currentElm.getChildNodes().getLength(); i++) {
      Element contextElm = (Element) currentElm.getChildNodes().item(i);
      String listAttrValue = contextElm.getAttribute("List");
      if (listAttrValue.equals(this.subPath(contextPath, startNum))) {
        for (int j = 0; j < contextElm.getChildNodes().getLength(); j++) {
          Element patternElm = (Element) contextElm.getChildNodes().item(j);
          String refAttrValue = patternElm.getAttribute("Ref");
          if (refAttrValue.equals(instancePath)) {
            return (Element) patternElm.getElementsByTagName("Contexts").item(0);
          }
        }

        Element patternElm = currentElm.getOwnerDocument().createElement("Pattern");
        patternElm.setAttribute("Ref", instancePath);
        contextElm.appendChild(patternElm);

        Element triggerElm = currentElm.getOwnerDocument().createElement("Trigger");
        Element constraintsElm = currentElm.getOwnerDocument().createElement("Constraints");
        Element contextsElm = currentElm.getOwnerDocument().createElement("Contexts");
        patternElm.appendChild(triggerElm);
        patternElm.appendChild(constraintsElm);
        patternElm.appendChild(contextsElm);

        Element errorMessageElm = currentElm.getOwnerDocument().createElement("ErrorMessage");
        Element assertionElm = currentElm.getOwnerDocument().createElement("Assertion");
        this.popTriggerAssertion(errorMessageElm, assertionElm, instancePath, orderIndifferentInfo.getTriggerInfo(), segmentList);
        triggerElm.appendChild(errorMessageElm);
        triggerElm.appendChild(assertionElm);

        return contextsElm;
      }
    }

    Element contextElm = currentElm.getOwnerDocument().createElement("Context");
    contextElm.setAttribute("List", this.subPath(contextPath, startNum));
    currentElm.appendChild(contextElm);
    Element patternElm = currentElm.getOwnerDocument().createElement("Pattern");
    patternElm.setAttribute("Ref", instancePath);
    contextElm.appendChild(patternElm);

    Element triggerElm = currentElm.getOwnerDocument().createElement("Trigger");
    Element constraintsElm = currentElm.getOwnerDocument().createElement("Constraints");
    Element contextsElm = currentElm.getOwnerDocument().createElement("Contexts");
    patternElm.appendChild(triggerElm);
    patternElm.appendChild(constraintsElm);
    patternElm.appendChild(contextsElm);

    Element errorMessageElm = currentElm.getOwnerDocument().createElement("ErrorMessage");
    Element assertionElm = currentElm.getOwnerDocument().createElement("Assertion");
    this.popTriggerAssertion(errorMessageElm, assertionElm, instancePath, orderIndifferentInfo.getTriggerInfo(), segmentList);
    triggerElm.appendChild(errorMessageElm);
    triggerElm.appendChild(assertionElm);

    return contextsElm;

  }

  /**
   * @param assertionElm
   * @param instancePath
   * @param triggerInfo
   */
  private void popTriggerAssertion(Element errorMessageElm, Element assertionElm, String instancePath,
      TriggerInfo triggerInfo, List<SegmentInstanceData> segmentList) { 
    
    if (triggerInfo.getList() != null && triggerInfo.getList().size() == 1) {
      TriggerPath triggerPath = triggerInfo.getList().get(0);
      this.popOneTriggerAssertion(null, errorMessageElm, assertionElm, triggerPath, instancePath, segmentList);
    }
    if (triggerInfo.getList() != null && triggerInfo.getList().size() > 1) {
      if(triggerInfo.getOperation().equals(Operation.AND)){
        Element forAllElm = assertionElm.getOwnerDocument().createElement("FORALL");
        for(TriggerPath triggerPath:triggerInfo.getList()){
          this.popOneTriggerAssertion(triggerInfo.getOperation(), errorMessageElm, forAllElm, triggerPath, instancePath, segmentList);
        }
        assertionElm.appendChild(forAllElm);        
      }else if(triggerInfo.getOperation().equals(Operation.OR)){
        Element existElm = assertionElm.getOwnerDocument().createElement("EXIST");
        for(TriggerPath triggerPath:triggerInfo.getList()){
          this.popOneTriggerAssertion(triggerInfo.getOperation(), errorMessageElm, existElm, triggerPath, instancePath, segmentList);
        }
        assertionElm.appendChild(existElm);        
      }

    }

  }
  
  private void popOneTriggerAssertion(Operation o, Element errorMessageElm, Element parent, TriggerPath triggerPath, String instancePath, List<SegmentInstanceData> segmentList){
    String segmentStr = this.findTriggerSegmentString(instancePath, triggerPath.getNamePath(), this.getPositionIPath(triggerPath.getPositionPath()), segmentList);
    
    Element andElm = parent.getOwnerDocument().createElement("AND");
    Element presenceElm = parent.getOwnerDocument().createElement("Presence");
    presenceElm.setAttribute("Path", this.getPositionIPath(triggerPath.getPositionPath()));
    Element plainTextElm = parent.getOwnerDocument().createElement("PlainText");
    plainTextElm.setAttribute("IgnoreCase", "true");
    plainTextElm.setAttribute("Path", this.getPositionIPath(triggerPath.getPositionPath()));
    String value = this.findTriggerValue(segmentStr, triggerPath.getNamePath());
    plainTextElm.setAttribute("Text",value);
    andElm.appendChild(presenceElm);
    andElm.appendChild(plainTextElm);
    parent.appendChild(andElm);
    if(o == null) errorMessageElm.setTextContent("OrderIndifferent Trigger ERROR: " + triggerPath.getNamePath() + " = '"  +  value + "' is expected");
    else {
      String existingErrorMessage = errorMessageElm.getTextContent();
      if(existingErrorMessage == null || existingErrorMessage.equals("")) errorMessageElm.setTextContent("OrderIndifferent Trigger ERROR: " + "[" + triggerPath.getNamePath() + " = '"  +  value + "' is expected]");
      else errorMessageElm.setTextContent(existingErrorMessage + " " + o.toString() + " " + "[ERROR " + triggerPath.getNamePath() + " = '"  +  value + "' is expected]");
    }
  }
  
  
  private String getPositionIPath(String positionPath) {
    if(positionPath != null){
      String result = "";
      for(String path :positionPath.split("\\.")){
        result = result + "." + path + "[1]";
      }
      return result.substring(1);
    }
    return null;
  }

  /**
   * @param instancePath
   * @param namePath
   * @param positionIPath
   * @return
   */
  private String findTriggerSegmentString(String instancePath, String namePath, String positionIPath, List<SegmentInstanceData> segmentList) {
    String result = instancePath;
    
    int key = -1;
    String[] split = namePath.split("\\.");
    for (int i = 0; i < split.length; i++) {
      if (!tryParseInt(split[i])) {
        key = i;
     }
    }
    
    split = positionIPath.split("\\.");
    for (int i = 0; i < key + 1; i++) {
      result = result + "." + split[i];
    }
    
    for(SegmentInstanceData instanceSegment : segmentList){
      if(instanceSegment.getPositionIPath().equals(result)) return instanceSegment.getLineStr();
    }
    
    return null;
  }

  /**
   * @param segmentName
   * @param segmentInstanceData
   * @param namePath
   * @return
   */
  private String findTriggerValue(String segmentStr, String namePath) {
    if(segmentStr != null){
      Integer fieldPosition = null;
      Integer componentPosition = null;
      Integer subComponentPosition = null;

      String[] split = namePath.split("\\.");
      for (int i = 0; i < split.length; i++) {
        if (tryParseInt(split[i])) {   
          if(fieldPosition == null) fieldPosition = Integer.parseInt(split[i]);
          else if(componentPosition == null) componentPosition = Integer.parseInt(split[i]);
          else if(subComponentPosition == null) subComponentPosition = Integer.parseInt(split[i]);
       }
      }
      
      if(fieldPosition != null && componentPosition == null && subComponentPosition == null) return this.getFieldStrFromSegment(segmentStr, fieldPosition);
      if(fieldPosition != null && componentPosition != null && subComponentPosition == null) {
        return this.getComponentStrFromField(this.getFieldStrFromSegment(segmentStr, fieldPosition), componentPosition);
      }
      if(fieldPosition != null && componentPosition != null && subComponentPosition != null) return this.getSubComponentStrFromField(this.getComponentStrFromField(this.getFieldStrFromSegment(segmentStr, fieldPosition), componentPosition), subComponentPosition);
      
    }

    return "?MISSING-VALUE?";
  }

  private boolean tryParseInt(String value) {
    try {
      Integer.parseInt(value);
      return true;
    } catch (NumberFormatException e) {
      return false;
    }
  }

  /**
   * @param contextPath
   * @param startNum
   * @return
   */
  private String subPath(String contextPath, int startNum) {
    if (startNum == 0)
      return contextPath;
    String result = "";
    String[] splits = contextPath.split("\\.");
    for (int i = startNum; i < splits.length; i++) {
      result = result + "." + splits[i];
    }
    return result.substring(1);
  }

  private void createOrderIndifferntConstraints(Element holderElm, Segment segment,
      SegmentInstanceData instanceSegment, Document xmlDoc, ConstraintXMLOutPut constraintXMLOutPut,
      String segmentiPositionPath, String segmentiPath, String segName, ProfileData profileData,
      String segUsagePath, TestStepSupplementsParams params) {
    int startNum = ((Element) holderElm.getParentNode()).getAttribute("Ref").split("\\.").length;

    DynamicInfo dynamicInfo = this.findDynamicInfo(segment, instanceSegment.getLineStr());
    for (int i = 0; i < segment.getChildren().size(); i++) {
      Field field = segment.getChildren().get(i);
      String wholeFieldStr = this.getFieldStrFromSegment(segName, instanceSegment, (i + 1));
      int fieldRepeatIndex = 0;

      String fieldUsagePath = segUsagePath + '-' + field.getUsage();
      for (int j = 0; j < wholeFieldStr.split("\\~").length; j++) {
        String fieldStr = wholeFieldStr.split("\\~")[j];
        Datatype fieldDT =
            profileData.getIntegrationProfile().findDatatypeById(field.getDatatypeId());

        if (dynamicInfo != null && dynamicInfo.getDynamicMappingTarget() != null
            && dynamicInfo.getDynamicMappingTarget().equals("" + (i + 1))
            && dynamicInfo.getDynamicMappingDatatypeId() != null) {
          fieldDT = profileData.getIntegrationProfile()
              .findDatatypeById(dynamicInfo.getDynamicMappingDatatypeId());
        }

        if (segName == "MSH" && (i + 1) == 1) {
          fieldStr = "|";
        }
        if (segName == "MSH" && (i + 1) == 2) {
          fieldStr = "^~\\&";
        }
        fieldRepeatIndex = fieldRepeatIndex + 1;
        String fieldiPath = "." + (i + 1) + "[" + fieldRepeatIndex + "]";

        if (fieldDT == null || fieldDT.getChildren() == null || fieldDT.getChildren().size() == 0) {
          Categorization cateOfField = params.getTestDataCategorizationMap()
              .get(this.replaceDot2Dash(segmentiPath + fieldiPath));
          this.createConstraint(subPath(segmentiPositionPath + fieldiPath, startNum), cateOfField,
              fieldUsagePath, xmlDoc, field.getName(), fieldStr, holderElm);
          constraintXMLOutPut.getCategorizationsDataMap()
              .put(this.replaceDot2Dash(segmentiPath + fieldiPath), fieldStr);
          constraintXMLOutPut.getCategorizationsUsageMap()
              .put(this.replaceDot2Dash(segmentiPath + fieldiPath), fieldUsagePath);
        } else {
          for (int k = 0; k < fieldDT.getChildren().size(); k++) {
            Component c = fieldDT.getChildren().get(k);
            String componentUsagePath = fieldUsagePath + '-' + c.getUsage();
            String componentiPath = "." + (k + 1) + "[1]";

            String componentStr = this.getComponentStrFromField(fieldStr, (k + 1));
            Datatype componentDT =
                profileData.getIntegrationProfile().findDatatypeById(c.getDatatypeId());
            if (componentDT == null || componentDT.getChildren() == null
                || componentDT.getChildren().size() == 0) {
              Categorization cateOfComponent = params.getTestDataCategorizationMap()
                  .get(this.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath));
              this.createConstraint(
                  subPath(segmentiPositionPath + fieldiPath + componentiPath, startNum),
                  cateOfComponent, componentUsagePath, xmlDoc, c.getName(), componentStr,
                  holderElm);
              constraintXMLOutPut.getCategorizationsDataMap().put(
                  this.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath), componentStr);
              constraintXMLOutPut.getCategorizationsUsageMap().put(
                  this.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath),
                  componentUsagePath);
            } else {
              for (int l = 0; l < componentDT.getChildren().size(); l++) {
                Component sc = componentDT.getChildren().get(l);
                String subComponentUsagePath = componentUsagePath + '-' + sc.getUsage();
                String subcomponentiPath = "." + (l + 1) + "[1]";
                String subcomponentStr = this.getSubComponentStrFromField(componentStr, (l + 1));
                Categorization cateOfSubComponent =
                    params.getTestDataCategorizationMap().get(this.replaceDot2Dash(
                        segmentiPath + fieldiPath + componentiPath + subcomponentiPath));
                this.createConstraint(
                    subPath(segmentiPositionPath + fieldiPath + componentiPath + subcomponentiPath,
                        startNum),
                    cateOfSubComponent, subComponentUsagePath, xmlDoc, sc.getName(),
                    subcomponentStr, holderElm);
                constraintXMLOutPut.getCategorizationsDataMap().put(
                    this.replaceDot2Dash(
                        segmentiPath + fieldiPath + componentiPath + subcomponentiPath),
                    subcomponentStr);
                constraintXMLOutPut.getCategorizationsUsageMap().put(
                    this.replaceDot2Dash(
                        segmentiPath + fieldiPath + componentiPath + subcomponentiPath),
                    subComponentUsagePath);
              }
            }
          }
        }
      }
    }
  }

  private void createOrderSpecificConstraints(Element holderElm, Segment segment,
      SegmentInstanceData instanceSegment, Document xmlDoc, ConstraintXMLOutPut constraintXMLOutPut,
      String segmentiPositionPath, String segmentiPath, String segName, ProfileData profileData,
      String segUsagePath, TestStepSupplementsParams params) {
    DynamicInfo dynamicInfo = this.findDynamicInfo(segment, instanceSegment.getLineStr());
    for (int i = 0; i < segment.getChildren().size(); i++) {
      Field field = segment.getChildren().get(i);
      String wholeFieldStr = this.getFieldStrFromSegment(segName, instanceSegment, (i + 1));
      int fieldRepeatIndex = 0;

      String fieldUsagePath = segUsagePath + '-' + field.getUsage();
      for (int j = 0; j < wholeFieldStr.split("\\~").length; j++) {
        String fieldStr = wholeFieldStr.split("\\~")[j];
        Datatype fieldDT =
            profileData.getIntegrationProfile().findDatatypeById(field.getDatatypeId());

        if (dynamicInfo != null && dynamicInfo.getDynamicMappingTarget() != null
            && dynamicInfo.getDynamicMappingTarget().equals("" + (i + 1))
            && dynamicInfo.getDynamicMappingDatatypeId() != null) {
          fieldDT = profileData.getIntegrationProfile()
              .findDatatypeById(dynamicInfo.getDynamicMappingDatatypeId());
        }

        if (segName == "MSH" && (i + 1) == 1) {
          fieldStr = "|";
        }
        if (segName == "MSH" && (i + 1) == 2) {
          fieldStr = "^~\\&";
        }
        fieldRepeatIndex = fieldRepeatIndex + 1;
        String fieldiPath = "." + (i + 1) + "[" + fieldRepeatIndex + "]";

        if (fieldDT == null || fieldDT.getChildren() == null || fieldDT.getChildren().size() == 0) {
          Categorization cateOfField = params.getTestDataCategorizationMap()
              .get(this.replaceDot2Dash(segmentiPath + fieldiPath));
          this.createConstraint(segmentiPositionPath + fieldiPath, cateOfField, fieldUsagePath,
              xmlDoc, field.getName(), fieldStr, holderElm);
          constraintXMLOutPut.getCategorizationsDataMap()
              .put(this.replaceDot2Dash(segmentiPath + fieldiPath), fieldStr);
          constraintXMLOutPut.getCategorizationsUsageMap()
              .put(this.replaceDot2Dash(segmentiPath + fieldiPath), fieldUsagePath);
        } else {
          for (int k = 0; k < fieldDT.getChildren().size(); k++) {
            Component c = fieldDT.getChildren().get(k);
            String componentUsagePath = fieldUsagePath + '-' + c.getUsage();
            String componentiPath = "." + (k + 1) + "[1]";

            String componentStr = this.getComponentStrFromField(fieldStr, (k + 1));
            Datatype componentDT =
                profileData.getIntegrationProfile().findDatatypeById(c.getDatatypeId());
            if (componentDT == null || componentDT.getChildren() == null
                || componentDT.getChildren().size() == 0) {
              Categorization cateOfComponent = params.getTestDataCategorizationMap()
                  .get(this.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath));
              this.createConstraint(segmentiPositionPath + fieldiPath + componentiPath,
                  cateOfComponent, componentUsagePath, xmlDoc, c.getName(), componentStr,
                  holderElm);
              constraintXMLOutPut.getCategorizationsDataMap().put(
                  this.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath), componentStr);
              constraintXMLOutPut.getCategorizationsUsageMap().put(
                  this.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath),
                  componentUsagePath);
            } else {
              for (int l = 0; l < componentDT.getChildren().size(); l++) {
                Component sc = componentDT.getChildren().get(l);
                String subComponentUsagePath = componentUsagePath + '-' + sc.getUsage();
                String subcomponentiPath = "." + (l + 1) + "[1]";
                String subcomponentStr = this.getSubComponentStrFromField(componentStr, (l + 1));
                Categorization cateOfSubComponent =
                    params.getTestDataCategorizationMap().get(this.replaceDot2Dash(
                        segmentiPath + fieldiPath + componentiPath + subcomponentiPath));
                this.createConstraint(
                    segmentiPositionPath + fieldiPath + componentiPath + subcomponentiPath,
                    cateOfSubComponent, subComponentUsagePath, xmlDoc, sc.getName(),
                    subcomponentStr, holderElm);
                constraintXMLOutPut.getCategorizationsDataMap().put(
                    this.replaceDot2Dash(
                        segmentiPath + fieldiPath + componentiPath + subcomponentiPath),
                    subcomponentStr);
                constraintXMLOutPut.getCategorizationsUsageMap().put(
                    this.replaceDot2Dash(
                        segmentiPath + fieldiPath + componentiPath + subcomponentiPath),
                    subComponentUsagePath);
              }
            }
          }
        }
      }
    }
  }

  private void createConstraint(String iPositionPath, Categorization cate, String usagePath,
      Document xmlDoc, String nodeName, String value, Element holderElm) {
    if (cate != null) {
      if (cate.getTestDataCategorization().equals("Indifferent")) {
      } else if (cate.getTestDataCategorization().equals("NonPresence")) {
        this.createNonPresenceCheck(iPositionPath, cate, usagePath, xmlDoc, nodeName, holderElm);
      } else if (cate.getTestDataCategorization().equals("Presence-Content Indifferent")
          || cate.getTestDataCategorization().equals("Presence-Configuration")
          || cate.getTestDataCategorization().equals("Presence-System Generated")
          || cate.getTestDataCategorization().equals("Presence-Test Case Proper")) {
        this.createPresenceCheck(iPositionPath, cate, usagePath, xmlDoc, nodeName, holderElm);
      } else if (cate.getTestDataCategorization().equals("Presence Length-Content Indifferent")
          || cate.getTestDataCategorization().equals("Presence Length-Configuration")
          || cate.getTestDataCategorization().equals("Presence Length-System Generated")
          || cate.getTestDataCategorization().equals("Presence Length-Test Case Proper")) {
        this.createPresenceCheck(iPositionPath, cate, usagePath, xmlDoc, nodeName, holderElm);
        this.createLengthCheck(iPositionPath, cate, usagePath, xmlDoc, nodeName, value, holderElm);
      } else if (cate.getTestDataCategorization().equals("Value-Test Case Fixed")) {
        this.createPresenceCheck(iPositionPath, cate, usagePath, xmlDoc, nodeName, holderElm);
        this.createPlainTextCheck(iPositionPath, cate, usagePath, xmlDoc, nodeName, value,
            holderElm);
      } else if (cate.getTestDataCategorization().equals("Value-Test Case Fixed List")) {
        this.createPresenceCheck(iPositionPath, cate, usagePath, xmlDoc, nodeName, holderElm);
        this.createStringListCheck(iPositionPath, cate, usagePath, xmlDoc, nodeName, value,
            holderElm);
      }
    }
  }

  private void createStringListCheck(String iPositionPath, Categorization cate, String usagePath,
      Document xmlDoc, String nodeName, String value, Element byIDElm) {
    if (cate != null && cate.getListData() != null && cate.getListData().size() > 0) {
      String values = String.join(",", cate.getListData());
      Element elmConstraint = xmlDoc.createElement("Constraint");
      Element elmReference = xmlDoc.createElement("Reference");
      elmReference.setAttribute("Source", "testcase");
      elmReference.setAttribute("GeneratedBy", "Test Case Authoring & Management Tool(TCAMT)");
      elmReference.setAttribute("ReferencePath", cate.getiPath());
      elmReference.setAttribute("TestDataCategorization", cate.getTestDataCategorization());
      elmConstraint.appendChild(elmReference);

      elmConstraint.setAttribute("ID", "Content");
      elmConstraint.setAttribute("Target", iPositionPath);
      Element elmDescription = xmlDoc.createElement("Description");
      elmDescription.appendChild(
          xmlDoc.createTextNode("Invalid content (based on test case fixed data). The value at "
              + this.modifyFormIPath(cate.getiPath()) + " (" + nodeName
              + ") does not match one of the expected values: " + values));
      Element elmAssertion = xmlDoc.createElement("Assertion");
      Element elmStringList = xmlDoc.createElement("StringList");
      elmStringList.setAttribute("Path", iPositionPath);
      elmStringList.setAttribute("CSV", values);
      elmAssertion.appendChild(elmStringList);
      elmConstraint.appendChild(elmDescription);
      elmConstraint.appendChild(elmAssertion);
      byIDElm.appendChild(elmConstraint);
    }
  }

  private void createPlainTextCheck(String iPositionPath, Categorization cate, String usagePath,
      Document xmlDoc, String nodeName, String value, Element byIDElm) {
    if (cate != null && value != null && !value.equals("")) {
      value = value.replaceAll("/(\\r\\n|\\n|\\r)/gm", "");
      Element elmConstraint = xmlDoc.createElement("Constraint");
      Element elmReference = xmlDoc.createElement("Reference");
      elmReference.setAttribute("Source", "testcase");
      elmReference.setAttribute("GeneratedBy", "Test Case Authoring & Management Tool(TCAMT)");
      elmReference.setAttribute("ReferencePath", cate.getiPath());
      elmReference.setAttribute("TestDataCategorization", cate.getTestDataCategorization());
      elmConstraint.appendChild(elmReference);

      elmConstraint.setAttribute("ID", "Content");
      elmConstraint.setAttribute("Target", iPositionPath);
      Element elmDescription = xmlDoc.createElement("Description");
      elmDescription.appendChild(
          xmlDoc.createTextNode("Invalid content (based on test case fixed data). The value at "
              + this.modifyFormIPath(cate.getiPath()) + " (" + nodeName
              + ") does not match the expected value: '" + value + "'."));
      Element elmAssertion = xmlDoc.createElement("Assertion");
      Element elmPlainText = xmlDoc.createElement("PlainText");
      elmPlainText.setAttribute("Path", iPositionPath);
      elmPlainText.setAttribute("Text", value);
      elmPlainText.setAttribute("IgnoreCase", "true");
      elmAssertion.appendChild(elmPlainText);
      elmConstraint.appendChild(elmDescription);
      elmConstraint.appendChild(elmAssertion);
      byIDElm.appendChild(elmConstraint);
    }
  }

  private void createLengthCheck(String iPositionPath, Categorization cate, String usagePath,
      Document xmlDoc, String nodeName, String value, Element byIDElm) {
    Element elmConstraint = xmlDoc.createElement("Constraint");
    Element elmReference = xmlDoc.createElement("Reference");
    elmReference.setAttribute("Source", "testcase");
    elmReference.setAttribute("GeneratedBy", "Test Case Authoring & Management Tool(TCAMT)");
    elmReference.setAttribute("ReferencePath", cate.getiPath());
    elmReference.setAttribute("TestDataCategorization", cate.getTestDataCategorization());
    elmConstraint.appendChild(elmReference);

    elmConstraint.setAttribute("ID", "Content");
    elmConstraint.setAttribute("Target", iPositionPath);
    Element elmDescription = xmlDoc.createElement("Description");
    elmDescription.appendChild(
        xmlDoc.createTextNode("Content does not meet the minimum length requirement. The value at "
            + this.modifyFormIPath(cate.getiPath()) + " (" + nodeName
            + ") is expected to be at minimum '" + value.length() + "' characters."));
    Element elmAssertion = xmlDoc.createElement("Assertion");
    Element elmFormat = xmlDoc.createElement("Format");
    elmFormat.setAttribute("Path", iPositionPath);
    elmFormat.setAttribute("Regex", "^.{" + value.length() + ",}$");
    elmAssertion.appendChild(elmFormat);
    elmConstraint.appendChild(elmDescription);
    elmConstraint.appendChild(elmAssertion);
    byIDElm.appendChild(elmConstraint);

  }

  private void createPresenceCheck(String iPositionPath, Categorization cate, String usagePath,
      Document xmlDoc, String nodeName, Element byIDElm) {
    boolean usageCheck = true;
    String[] usage = usagePath.split("-");
    for (int i = 0; i < usage.length; i++) {
      String u = usage[i];
      if (!u.equals("R")) {
        usageCheck = false;
      }
    }

    if (!usageCheck) {
      Element elmConstraint = xmlDoc.createElement("Constraint");
      Element elmReference = xmlDoc.createElement("Reference");
      elmReference.setAttribute("Source", "testcase");
      elmReference.setAttribute("GeneratedBy", "Test Case Authoring & Management Tool(TCAMT)");
      elmReference.setAttribute("ReferencePath", cate.getiPath());
      elmReference.setAttribute("TestDataCategorization", cate.getTestDataCategorization());
      elmConstraint.appendChild(elmReference);

      elmConstraint.setAttribute("ID", "Content");
      elmConstraint.setAttribute("Target", iPositionPath);
      Element elmDescription = xmlDoc.createElement("Description");
      elmDescription.appendChild(xmlDoc.createTextNode(
          "Expected content is missing. The empty value at " + this.modifyFormIPath(cate.getiPath())
              + " (" + nodeName + ") is expected to be present."));
      Element elmAssertion = xmlDoc.createElement("Assertion");
      Element elmPresence = xmlDoc.createElement("Presence");
      elmPresence.setAttribute("Path", iPositionPath);
      elmAssertion.appendChild(elmPresence);
      elmConstraint.appendChild(elmDescription);
      elmConstraint.appendChild(elmAssertion);
      byIDElm.appendChild(elmConstraint);
    }
  }

  private void createNonPresenceCheck(String iPositionPath, Categorization cate, String usagePath,
      Document xmlDoc, String nodeName, Element byIDElm) {
    Element elmConstraint = xmlDoc.createElement("Constraint");
    Element elmReference = xmlDoc.createElement("Reference");
    elmReference.setAttribute("Source", "testcase");
    elmReference.setAttribute("GeneratedBy", "Test Case Authoring & Management Tool(TCAMT)");
    elmReference.setAttribute("ReferencePath", cate.getiPath());
    elmReference.setAttribute("TestDataCategorization", cate.getTestDataCategorization());
    elmConstraint.appendChild(elmReference);

    elmConstraint.setAttribute("ID", "Content");
    elmConstraint.setAttribute("Target", iPositionPath);
    Element elmDescription = xmlDoc.createElement("Description");
    elmDescription.appendChild(xmlDoc.createTextNode(
        "Unexpected content found. The value at " + this.modifyFormIPath(cate.getiPath()) + " ("
            + nodeName + ") is not expected to be valued for test case."));
    Element elmAssertion = xmlDoc.createElement("Assertion");
    Element elmPresence = xmlDoc.createElement("Presence");
    Element elmNOT = xmlDoc.createElement("NOT");
    elmPresence.setAttribute("Path", iPositionPath);
    elmNOT.appendChild(elmPresence);
    elmAssertion.appendChild(elmNOT);
    elmConstraint.appendChild(elmDescription);
    elmConstraint.appendChild(elmAssertion);
    byIDElm.appendChild(elmConstraint);

  }

  private String modifyFormIPath(String iPath) {
    String result = "";
    if (iPath == null || iPath == "")
      return result;
    String[] pathList = iPath.split("\\.");
    String currentType = "GroupOrSegment";
    String previousType = "GroupOrSegment";

    for (int i = 0; i < pathList.length; i++) {
      String p = pathList[i];
      String path = p.substring(0, p.indexOf("["));
      int instanceNum = Integer.parseInt((p.substring(p.indexOf("[") + 1, p.indexOf("]"))));

      if (this.isNumeric(path)) {
        currentType = "FieldOrComponent";
      } else {
        currentType = "GroupOrSegment";
      }

      if (instanceNum == 1) {
        if (currentType.equals("FieldOrComponent") && previousType.equals("GroupOrSegment")) {
          result = result + "-" + path;
        } else {
          result = result + "." + path;
        }
      } else {
        if (currentType.equals("FieldOrComponent") && previousType.equals("GroupOrSegment")) {
          result = result + "-" + path + "[" + instanceNum + "]";
        } else {
          result = result + "." + path + "[" + instanceNum + "]";
        }
      }
      previousType = currentType;
    }
    return result.substring(1);
  }

  private boolean isNumeric(String str) {
    return str.matches("-?\\d+(\\.\\d+)?");
  }

  private String generateMessageContentXML(TestStepSupplementsParams params,
      ProfileData profileData) throws Exception {
    if (params.getTestDataCategorizationMap() == null)
      params.setTestDataCategorizationMap(new HashMap<String, Categorization>());

    if (profileData != null && profileData.getIntegrationProfile() != null) {
      ConformanceProfile cp = profileData.getIntegrationProfile()
          .findConformanceProfileById(params.getConformanceProfileId());

      if (cp != null) {
        String rootName = "MessageContent";
        String xmlString = "<" + rootName + ">" + "</" + rootName + ">";
        Document xmlDoc = XMLManager.stringToDom(xmlString);
        Element rootElement = (Element) xmlDoc.getElementsByTagName(rootName).item(0);

        TestStepParams testStepParams = new TestStepParams();
        testStepParams.setConformanceProfileId(params.getConformanceProfileId());
        testStepParams.setEr7Message(params.getEr7Message());
        testStepParams.setIntegrationProfileId(params.getIntegrationProfileId());
        List<SegmentInstanceData> segmentList = this.popSegmentList(testStepParams, profileData);

        if (segmentList != null) {

          for (SegmentInstanceData segmentInstanceData : segmentList) {
            Segment segment = segmentInstanceData.getSegmentDef();
            String segName = segmentInstanceData.getSegmentName();
            String segDesc = segment.getDescription();
            String segmentiPath = segmentInstanceData.getiPath();

            DynamicInfo dynamicInfo =
                this.findDynamicInfo(segment, segmentInstanceData.getLineStr());

            Element segmentElement = xmlDoc.createElement("Segment");
            segmentElement.setAttribute("Name", segName);
            segmentElement.setAttribute("Description", segDesc);
            segmentElement.setAttribute("InstancePath", segmentiPath);
            rootElement.appendChild(segmentElement);

            for (int i = 0; i < segment.getChildren().size(); i++) {
              Field field = segment.getChildren().get(i);
              if (!this.isHideForMessageContentByUsage(segment, field,
                  segmentInstanceData.getPositionPath() + "." + (i + 1), cp, profileData)) {
                String wholeFieldStr =
                    this.getFieldStrFromSegment(segName, segmentInstanceData, (i + 1));
                int fieldRepeatIndex = 0;
                for (int j = 0; j < wholeFieldStr.split("\\~").length; j++) {
                  String fieldStr = wholeFieldStr.split("\\~")[j];
                  Datatype fieldDT =
                      profileData.getIntegrationProfile().findDatatypeById(field.getDatatypeId());
                  if (segName.equals("MSH") && (i + 1) == 1) {
                    fieldStr = "|";
                  }
                  if (segName.equals("MSH") && (i + 1) == 2) {
                    fieldStr = "^~\\&";
                  }
                  fieldRepeatIndex = fieldRepeatIndex + 1;
                  String fieldiPath = "." + (i + 1) + "[" + fieldRepeatIndex + "]";

                  if (dynamicInfo != null && dynamicInfo.getDynamicMappingTarget() != null
                      && dynamicInfo.getDynamicMappingTarget().equals("" + (i + 1))
                      && dynamicInfo.getDynamicMappingDatatypeId() != null) {
                    fieldDT = profileData.getIntegrationProfile()
                        .findDatatypeById(dynamicInfo.getDynamicMappingDatatypeId());
                  }

                  if (fieldDT == null || fieldDT.getChildren() == null
                      || fieldDT.getChildren().size() == 0) {
                    String tdcstrOfField = "";
                    Categorization cateOfField = params.getTestDataCategorizationMap()
                        .get(this.replaceDot2Dash(segmentiPath + fieldiPath));
                    if (cateOfField != null)
                      tdcstrOfField = cateOfField.getTestDataCategorization();

                    Element fieldElement = xmlDoc.createElement("Field");
                    fieldElement.setAttribute("Location", segName + "." + (i + 1));
                    fieldElement.setAttribute("DataElement", field.getName());
                    fieldElement.setAttribute("Data", fieldStr);
                    fieldElement.setAttribute("Categrization", tdcstrOfField);
                    segmentElement.appendChild(fieldElement);
                  } else {
                    Element fieldElement = xmlDoc.createElement("Field");
                    fieldElement.setAttribute("Location", segName + "." + (i + 1));
                    fieldElement.setAttribute("DataElement", field.getName());
                    segmentElement.appendChild(fieldElement);
                    if (fieldDT != null && fieldDT.getChildren() != null) {
                      for (int k = 0; k < fieldDT.getChildren().size(); k++) {
                        Component c = fieldDT.getChildren().get(k);
                        String componentiPath = "." + (k + 1) + "[1]";
                        if (!this.isHideForMessageContentByUsage(segment, c, fieldDT, "component",
                            segmentInstanceData.getPositionPath() + "." + (i + 1) + "." + (k + 1),
                            cp, profileData)) {
                          String componentStr = this.getComponentStrFromField(fieldStr, k + 1);
                          Datatype componentDT = profileData.getIntegrationProfile()
                              .findDatatypeById(c.getDatatypeId());
                          if (componentDT != null) {
                            if (componentDT.getChildren() == null
                                || componentDT.getChildren().size() == 0) {
                              String tdcstrOfComponent = "";
                              Categorization cateOfComponent =
                                  params.getTestDataCategorizationMap().get(this
                                      .replaceDot2Dash(segmentiPath + fieldiPath + componentiPath));
                              if (cateOfComponent != null)
                                tdcstrOfComponent = cateOfComponent.getTestDataCategorization();

                              Element componentElement = xmlDoc.createElement("Component");
                              componentElement.setAttribute("Location",
                                  segName + "." + (i + 1) + "." + (k + 1));
                              componentElement.setAttribute("DataElement", c.getName());
                              componentElement.setAttribute("Data", componentStr);
                              componentElement.setAttribute("Categrization", tdcstrOfComponent);
                              fieldElement.appendChild(componentElement);
                            } else {
                              Element componentElement = xmlDoc.createElement("Component");
                              componentElement.setAttribute("Location",
                                  segName + "." + (i + 1) + "." + (k + 1));
                              componentElement.setAttribute("DataElement", c.getName());
                              fieldElement.appendChild(componentElement);

                              for (int l = 0; l < componentDT.getChildren().size(); l++) {
                                Component sc = componentDT.getChildren().get(l);

                                if (!this.isHideForMessageContentByUsage(segment, sc, componentDT,
                                    "subComponent", segmentInstanceData.getPositionPath() + "."
                                        + (i + 1) + "." + (k + 1) + "." + (l + 1),
                                    cp, profileData)) {
                                  String subcomponentiPath = "." + (l + 1) + "[1]";
                                  String subcomponentStr =
                                      this.getSubComponentStrFromField(componentStr, (l + 1));
                                  String tdcstrOfSubComponent = "";
                                  Categorization cateOfSubComponent =
                                      params.getTestDataCategorizationMap()
                                          .get(this.replaceDot2Dash(segmentiPath + fieldiPath
                                              + componentiPath + subcomponentiPath));
                                  if (cateOfSubComponent != null)
                                    tdcstrOfSubComponent =
                                        cateOfSubComponent.getTestDataCategorization();
                                  Element subComponentElement =
                                      xmlDoc.createElement("SubComponent");
                                  subComponentElement.setAttribute("Location",
                                      segName + "." + (i + 1) + "." + (k + 1) + "." + (l + 1));
                                  subComponentElement.setAttribute("DataElement", sc.getName());
                                  subComponentElement.setAttribute("Data", subcomponentStr);
                                  subComponentElement.setAttribute("Categrization",
                                      tdcstrOfSubComponent);
                                  componentElement.appendChild(subComponentElement);
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          return XMLManager.docToString(xmlDoc);
        }
      }
    }
    return null;
  }

  private String replaceDot2Dash(String path) {
    return path.replaceAll("\\.", "-");
  }

  private String getSubComponentStrFromField(String componentStr, int position) {
    String[] subComponentStr = componentStr.split("\\&");

    if (position > subComponentStr.length)
      return "";
    else
      return subComponentStr[position - 1];
  }

  private String getComponentStrFromField(String fieldStr, int position) {
    String[] componentStr = fieldStr.split("\\^");

    if (position > componentStr.length)
      return "";
    else
      return componentStr[position - 1];
  }

  private String getFieldStrFromSegment(String segmentName, SegmentInstanceData segmentInstanceData,
      int fieldPosition) {
    String segmentStr = segmentInstanceData.getLineStr();
    if (segmentName.equals("MSH")) {
      segmentStr = "MSH|FieldSeperator|Encoding|" + segmentStr.substring(9);
    }
    String[] wholeFieldStr = segmentStr.split("\\|");

    if (fieldPosition > wholeFieldStr.length - 1)
      return "";
    else
      return wholeFieldStr[fieldPosition];
  }
  
  private String getFieldStrFromSegment(String segmentStr, int fieldPosition) {
    if (segmentStr.startsWith("MSH")) {
      segmentStr = "MSH|FieldSeperator|Encoding|" + segmentStr.substring(9);
    }
    String[] wholeFieldStr = segmentStr.split("\\|");

    if (fieldPosition > wholeFieldStr.length - 1)
      return "";
    else
      return wholeFieldStr[fieldPosition];
  }

  private boolean isHideForMessageContentByUsage(Segment segment, Field field, String positionPath,
      ConformanceProfile cp, ProfileData profileData) {
    if (field.isHide())
      return true;

    if (field.getUsage().equals(Usage.R))
      return false;
    if (field.getUsage().equals(Usage.RE))
      return false;

    if (field.getUsage().equals(Usage.C)) {
      Predicate p = this.findPredicate(cp.getConformanceProfileMetaData().getId(), segment, null,
          positionPath, "field", profileData);

      if (p != null) {
        if (p.getTrueUsage().equals(Usage.R))
          return false;
        if (p.getTrueUsage().equals(Usage.RE))
          return false;
        if (p.getFalseUsage().equals(Usage.R))
          return false;
        if (p.getFalseUsage().equals(Usage.RE))
          return false;
      }
    }
    return true;
  }

  private boolean isHideForMessageContentByUsage(Segment segment, Component component, Datatype dt,
      String type, String positionPath, ConformanceProfile cp, ProfileData profileData) {
    if (component.isHide())
      return true;

    if (component.getUsage().equals(Usage.R))
      return false;
    if (component.getUsage().equals(Usage.RE))
      return false;

    if (component.getUsage().equals(Usage.C)) {
      Predicate p = this.findPredicate(cp.getConformanceProfileMetaData().getId(), segment, dt,
          positionPath, type, profileData);

      if (p != null) {
        if (p.getTrueUsage().equals(Usage.R))
          return false;
        if (p.getTrueUsage().equals(Usage.RE))
          return false;
        if (p.getFalseUsage().equals(Usage.R))
          return false;
        if (p.getFalseUsage().equals(Usage.RE))
          return false;
      }
    }
    return true;
  }

  private static String parseXmlByXSLT(String sourceStr, String xsltStr) {
    System.setProperty("javax.xml.transform.TransformerFactory",
        "net.sf.saxon.TransformerFactoryImpl");
    TransformerFactory tFactory = TransformerFactory.newInstance();

    try {
      Transformer transformer =
          tFactory.newTransformer(new StreamSource(new java.io.StringReader(xsltStr)));
      StringWriter outWriter = new StringWriter();
      StreamResult result = new StreamResult(outWriter);

      transformer.transform(new StreamSource(new java.io.StringReader(sourceStr)), result);
      StringBuffer sb = outWriter.getBuffer();
      String finalstring = sb.toString();

      return finalstring;
    } catch (Exception e) {
      e.printStackTrace();
    }

    return null;
  }

  private void generateNISTSegment(Element segmentElm, SegmentInstanceData instanceSegment,
      Document xmlDoc, IntegrationProfile integrationProfile) {
    String lineStr = instanceSegment.getLineStr();
    String segmentName = lineStr.substring(0, 3);
    Segment segment = instanceSegment.getSegmentDef();

    if (lineStr.startsWith("MSH")) {
      lineStr = "MSH|%SEGMENTDVIDER%|%ENCODINGDVIDER%" + lineStr.substring(8);
    }

    String[] fieldStrs = lineStr.substring(4).split("\\|");

    for (int i = 0; i < fieldStrs.length; i++) {
      String[] fieldStrRepeats = fieldStrs[i].split("~");
      for (int g = 0; g < fieldStrRepeats.length; g++) {
        String fieldStr = fieldStrRepeats[g];

        if (fieldStr.equals("%SEGMENTDVIDER%")) {
          Element fieldElm = (Element) xmlDoc.createElement("MSH.1");
          Text value = xmlDoc.createTextNode("|");
          fieldElm.appendChild(value);
          segmentElm.appendChild(fieldElm);
        } else if (fieldStr.equals("%ENCODINGDVIDER%")) {
          Element fieldElm = (Element) xmlDoc.createElement("MSH.2");
          Text value = xmlDoc.createTextNode("^~\\&");
          fieldElm.appendChild(value);
          segmentElm.appendChild(fieldElm);
        } else {
          if (fieldStr != null && !fieldStr.equals("")) {
            if (i < segment.getChildren().size()) {
              Field field = segment.getChildren().get(i);
              Element fieldElm = (Element) xmlDoc.createElement(segmentName + "." + (i + 1));
              Datatype fieldDatatype = integrationProfile.findDatatypeById(field.getDatatypeId());
              if (fieldDatatype == null || fieldDatatype.getChildren() == null
                  || fieldDatatype.getChildren().size() == 0) {
                if (lineStr.startsWith("OBX")) {
                  if ((i + 1) == 2) {
                    Text value = xmlDoc.createTextNode(fieldStr);
                    fieldElm.appendChild(value);
                  } else if ((i + 1) == 5) {
                    String[] componentStrs = fieldStr.split("\\^");
                    for (int index = 0; index < componentStrs.length; index++) {
                      String componentStr = componentStrs[index];
                      Element componentElm =
                          xmlDoc.createElement(segmentName + "." + (i + 1) + "." + (index + 1));
                      Text value = xmlDoc.createTextNode(componentStr);
                      componentElm.appendChild(value);
                      fieldElm.appendChild(componentElm);
                    }
                  } else {
                    Text value = xmlDoc.createTextNode(fieldStr);
                    fieldElm.appendChild(value);
                  }
                } else {
                  Text value = xmlDoc.createTextNode(fieldStr);
                  fieldElm.appendChild(value);
                }
              } else {
                String[] componentStrs = fieldStr.split("\\^");
                for (int j = 0; j < componentStrs.length; j++) {
                  Datatype componentDT = integrationProfile.findDatatypeById(field.getDatatypeId());
                  if (componentDT != null && componentDT.getChildren() != null) {
                    if (j < componentDT.getChildren().size()) {
                      Component component = componentDT.getChildren().get(j);
                      String componentStr = componentStrs[j];
                      if (componentStr != null && !componentStr.equals("")) {
                        Element componentElm =
                            xmlDoc.createElement(segmentName + "." + (i + 1) + "." + (j + 1));
                        Datatype subComponentDT =
                            integrationProfile.findDatatypeById(component.getDatatypeId());
                        if (subComponentDT.getChildren() == null
                            || subComponentDT.getChildren().size() == 0) {
                          Text value = xmlDoc.createTextNode(componentStr);
                          componentElm.appendChild(value);
                        } else {
                          String[] subComponentStrs = componentStr.split("\\&");
                          for (int k = 0; k < subComponentStrs.length; k++) {
                            String subComponentStr = subComponentStrs[k];
                            if (subComponentStr != null && !subComponentStr.equals("")) {
                              Element subComponentElm = xmlDoc.createElement(
                                  segmentName + "." + (i + 1) + "." + (j + 1) + "." + (k + 1));
                              Text value = xmlDoc.createTextNode(subComponentStr);
                              subComponentElm.appendChild(value);
                              componentElm.appendChild(subComponentElm);
                            }
                          }

                        }
                        fieldElm.appendChild(componentElm);
                      }
                    }
                  }

                }

              }
              segmentElm.appendChild(fieldElm);
            }
          }
        }
      }
    }

  }

  private void generateSTDSegment(Element segmentElm, SegmentInstanceData instanceSegment,
      Document xmlDoc, IntegrationProfile integrationProfile) {
    String lineStr = instanceSegment.getLineStr();
    String segmentName = lineStr.substring(0, 3);
    Segment segment = instanceSegment.getSegmentDef();
    String variesDT = "";

    if (lineStr.startsWith("MSH")) {
      lineStr = "MSH|%SEGMENTDVIDER%|%ENCODINGDVIDER%" + lineStr.substring(8);
    }

    String[] fieldStrs = lineStr.substring(4).split("\\|");

    for (int i = 0; i < fieldStrs.length; i++) {
      String[] fieldStrRepeats = fieldStrs[i].split("\\~");
      for (int g = 0; g < fieldStrRepeats.length; g++) {
        String fieldStr = fieldStrRepeats[g];
        if (fieldStr.equals("%SEGMENTDVIDER%")) {
          Element fieldElm = xmlDoc.createElement("MSH.1");
          Text value = xmlDoc.createTextNode("|");
          fieldElm.appendChild(value);
          segmentElm.appendChild(fieldElm);
        } else if (fieldStr.equals("%ENCODINGDVIDER%")) {
          Element fieldElm = xmlDoc.createElement("MSH.2");
          Text value = xmlDoc.createTextNode("^~\\&");
          fieldElm.appendChild(value);
          segmentElm.appendChild(fieldElm);
        } else {
          if (fieldStr != null && !fieldStr.equals("")) {
            if (i < segment.getChildren().size()) {
              Field field = segment.getChildren().get(i);
              Element fieldElm = xmlDoc.createElement(segmentName + "." + (i + 1));
              Datatype fieldDatatype = integrationProfile.findDatatypeById(field.getDatatypeId());
              if (fieldDatatype == null || fieldDatatype.getChildren() == null
                  || fieldDatatype.getChildren().size() == 0) {
                if (lineStr.startsWith("OBX")) {
                  if ((i + 1) == 2) {
                    variesDT = fieldStr;
                    Text value = xmlDoc.createTextNode(fieldStr);
                    fieldElm.appendChild(value);
                  } else if ((i + 1) == 5) {
                    String[] componentStrs = fieldStr.split("\\^");

                    for (int index = 0; index < componentStrs.length; index++) {
                      String componentStr = componentStrs[index];
                      Element componentElm = xmlDoc.createElement(variesDT + "." + (index + 1));
                      Text value = xmlDoc.createTextNode(componentStr);
                      componentElm.appendChild(value);
                      fieldElm.appendChild(componentElm);
                    }
                  } else {
                    Text value = xmlDoc.createTextNode(fieldStr);
                    fieldElm.appendChild(value);
                  }
                } else {
                  Text value = xmlDoc.createTextNode(fieldStr);
                  fieldElm.appendChild(value);
                }
              } else {
                String[] componentStrs = fieldStr.split("\\^");
                Datatype componentDT = integrationProfile.findDatatypeById(field.getDatatypeId());
                String componentDataTypeName = componentDT.getName();
                for (int j = 0; j < componentStrs.length; j++) {
                  if (componentDT.getChildren() != null && j < componentDT.getChildren().size()) {
                    Component component = componentDT.getChildren().get(j);
                    String componentStr = componentStrs[j];
                    if (componentStr != null && !componentStr.equals("")) {
                      Element componentElm =
                          xmlDoc.createElement(componentDataTypeName + "." + (j + 1));
                      Datatype subComponentDT =
                          integrationProfile.findDatatypeById(component.getDatatypeId());
                      if (subComponentDT.getChildren() == null
                          || subComponentDT.getChildren().size() == 0) {
                        Text value = xmlDoc.createTextNode(componentStr);
                        componentElm.appendChild(value);
                      } else {
                        String[] subComponentStrs = componentStr.split("\\&");
                        String subComponentDataTypeName = subComponentDT.getName();

                        for (int k = 0; k < subComponentStrs.length; k++) {
                          String subComponentStr = subComponentStrs[k];
                          if (subComponentStr != null && !subComponentStr.equals("")) {
                            Element subComponentElm =
                                xmlDoc.createElement(subComponentDataTypeName + "." + (k + 1));
                            Text value = xmlDoc.createTextNode(subComponentStr);
                            subComponentElm.appendChild(value);
                            componentElm.appendChild(subComponentElm);
                          }
                        }

                      }
                      fieldElm.appendChild(componentElm);
                    }
                  }
                }

              }
              segmentElm.appendChild(fieldElm);
            }
          }
        }
      }
    }
  }

  private DynamicInfo findDynamicInfo(Segment s, String segmentStr) {
    DynamicInfo dynamicInfo = new DynamicInfo();

    if (s.getDynamicMapping() != null && s.getDynamicMapping().getDynamicMappingDef() != null
        && s.getDynamicMapping().getItems() != null) {
      if (s.getDynamicMapping().getItems().size() > 0) {
        if (s.getDynamicMapping().getDynamicMappingDef().getPostion() != null
            && !s.getDynamicMapping().getDynamicMappingDef().getPostion().equals("")) {
          if (s.getDynamicMapping().getDynamicMappingDef().getReference() != null
              && !s.getDynamicMapping().getDynamicMappingDef().getReference().equals("")) {

            dynamicInfo
                .setDynamicMappingTarget(s.getDynamicMapping().getDynamicMappingDef().getPostion());
            String referenceLocation = s.getDynamicMapping().getDynamicMappingDef().getReference();
            String secondReferenceLocation =
                s.getDynamicMapping().getDynamicMappingDef().getSecondReference();

            String referenceValue = this.findValueByPath(segmentStr, referenceLocation);
            String secondReferenceLocationValue =
                this.findValueByPath(segmentStr, secondReferenceLocation);
            dynamicInfo.setDynamicMappingDatatypeId(s.getDynamicMapping()
                .findDataypteIdByReferences(referenceValue, secondReferenceLocationValue));
            return dynamicInfo;
          }
        }
      }
    }

    return null;
  }

  private List<FieldNode> popFields(Segment s, String segmentStr, SegmentParams params,
      DynamicInfo dynamicInfo, ProfileData profileData) {

    List<FieldNode> filedNodes = new ArrayList<FieldNode>();

    String[] splittedSegmentStr = segmentStr.split("\\|");
    List<String> fieldValues = new ArrayList<String>();

    if (splittedSegmentStr[0].equals("MSH")) {
      fieldValues.add("|");
      fieldValues.add("^~\\&");
      for (int index = 2; index < splittedSegmentStr.length; index++) {
        fieldValues.add(splittedSegmentStr[index]);
      }
    } else {
      for (int index = 1; index < splittedSegmentStr.length; index++) {
        fieldValues.add(splittedSegmentStr[index]);
      }
    }

    for (int i = 0; i < s.getChildren().size(); i++) {
      List<String> fieldInstanceValues = new ArrayList<String>();
      if (splittedSegmentStr[0].equals("MSH") && i == 1) {
        fieldInstanceValues.add("^~\\&");
      } else {
        if (i < fieldValues.size()) {
          fieldInstanceValues = Arrays.asList(fieldValues.get(i).split("~"));
        } else {
          fieldInstanceValues.add("");
        }
      }

      for (int h = 0; h < fieldInstanceValues.size(); h++) {
        Field f = s.getChildren().get(i);
        Datatype fieldDt = profileData.getIntegrationProfile().findDatatypeById(f.getDatatypeId());
        FieldNode fieldNode = new FieldNode();
        fieldNode.setField(f);
        fieldNode.setiPath(params.getiPath() + "." + (i + 1) + "[" + (h + 1) + "]");
        fieldNode.setPath(params.getPath() + "." + (i + 1));
        fieldNode.setPositioniPath(params.getiPositionPath() + "." + (i + 1) + "[" + (h + 1) + "]");
        fieldNode.setPositionPath(params.getPositionPath() + "." + (i + 1));
        fieldNode.setType("field");
        fieldNode.setUsagePath(params.getUsagePath() + "-" + f.getUsage());
        fieldNode.setValue(fieldInstanceValues.get(h));

        if (dynamicInfo != null && dynamicInfo.getDynamicMappingTarget() != null
            && dynamicInfo.getDynamicMappingTarget().equals("" + (i + 1))
            && dynamicInfo.getDynamicMappingDatatypeId() != null) {
          fieldNode.setDt(profileData.getIntegrationProfile()
              .findDatatypeById(dynamicInfo.getDynamicMappingDatatypeId()));
        } else {
          fieldNode.setDt(fieldDt);
        }

        if (f.getBindingId() != null) {
          for (String bid : f.getBindingId().split("\\:")) {
            fieldNode.addBindingIdentifier(bid);
          }
        }

        if (f.getUsage().equals(Usage.C))
          fieldNode.setPredicate(this.findPredicate(params.getConformanceProfileId(), s, null,
              fieldNode.getPositionPath(), "field", profileData));

        if (params.getTestDataCategorizationMap() != null) {
          Categorization fieldTestDataCategorizationObj = params.getTestDataCategorizationMap()
              .get(this.replaceDotToDash(fieldNode.getiPath()));
          if (fieldTestDataCategorizationObj != null) {
            fieldNode.setTestDataCategorization(
                fieldTestDataCategorizationObj.getTestDataCategorization());
            fieldNode
                .setTestDataCategorizationListData(fieldTestDataCategorizationObj.getListData());
          }
        }

        List<String> componentValues = new ArrayList<String>();
        if (h < fieldInstanceValues.size())
          componentValues = Arrays.asList(fieldInstanceValues.get(h).split("\\^"));

        if (fieldNode.getDt().getChildren() != null) {
          for (int j = 0; j < fieldNode.getDt().getChildren().size(); j++) {
            Component c = fieldNode.getDt().getChildren().get(j);
            Datatype componentDt =
                profileData.getIntegrationProfile().findDatatypeById(c.getDatatypeId());
            ComponentNode componentNode = new ComponentNode();
            componentNode.setDt(componentDt);
            componentNode.setComponent(c);
            componentNode.setiPath(fieldNode.getiPath() + "." + (j + 1) + "[1]");
            componentNode.setPath(fieldNode.getPath() + "." + (j + 1));
            componentNode.setPositioniPath(fieldNode.getPositioniPath() + "." + (j + 1) + "[1]");
            componentNode.setPositionPath(fieldNode.getPositionPath() + "." + (j + 1));
            componentNode.setType("component");
            componentNode.setUsagePath(fieldNode.getUsagePath() + "-" + c.getUsage());
            if (j < componentValues.size())
              componentNode.setValue(componentValues.get(j));
            else
              componentNode.setValue("");

            if (c.getBindingId() != null) {
              for (String bid : c.getBindingId().split("\\:")) {
                componentNode.addBindingIdentifier(bid);
              }
            }

            if (c.getUsage().equals(Usage.C))
              componentNode.setPredicate(this.findPredicate(params.getConformanceProfileId(), s,
                  fieldDt, componentNode.getPositionPath(), "component", profileData));

            if (params.getTestDataCategorizationMap() != null) {
              Categorization componentTestDataCategorizationObj =
                  params.getTestDataCategorizationMap()
                      .get(this.replaceDotToDash(componentNode.getiPath()));
              if (componentTestDataCategorizationObj != null) {
                componentNode.setTestDataCategorization(
                    componentTestDataCategorizationObj.getTestDataCategorization());
                componentNode.setTestDataCategorizationListData(
                    componentTestDataCategorizationObj.getListData());
              }
            }

            List<String> subComponentValues = new ArrayList<String>();
            if (j < componentValues.size())
              subComponentValues = Arrays.asList(componentValues.get(j).split("\\&"));
            if (componentNode.getDt().getChildren() != null) {
              for (int k = 0; k < componentNode.getDt().getChildren().size(); k++) {
                Component sc = componentNode.getDt().getChildren().get(k);
                Datatype subComponentDt =
                    profileData.getIntegrationProfile().findDatatypeById(sc.getDatatypeId());
                SubComponentNode subComponentNode = new SubComponentNode();
                subComponentNode.setDt(subComponentDt);
                subComponentNode.setComponent(sc);
                subComponentNode.setiPath(componentNode.getiPath() + "." + (k + 1) + "[1]");
                subComponentNode.setPath(componentNode.getPath() + "." + (k + 1));
                subComponentNode
                    .setPositioniPath(componentNode.getPositioniPath() + "." + (k + 1) + "[1]");
                subComponentNode.setPositionPath(componentNode.getPositionPath() + "." + (k + 1));
                subComponentNode.setType("subcomponent");
                subComponentNode.setUsagePath(componentNode.getUsagePath() + "-" + sc.getUsage());
                if (k < subComponentValues.size())
                  subComponentNode.setValue(subComponentValues.get(k));
                else
                  subComponentNode.setValue("");

                if (sc.getBindingId() != null) {
                  for (String bid : sc.getBindingId().split("\\:")) {
                    subComponentNode.addBindingIdentifier(bid);
                  }
                }

                if (sc.getUsage().equals(Usage.C))
                  subComponentNode.setPredicate(
                      this.findPredicate(params.getConformanceProfileId(), s, componentDt,
                          subComponentNode.getPositionPath(), "subComponent", profileData));

                if (params.getTestDataCategorizationMap() != null) {
                  Categorization subComponentTestDataCategorizationObj =
                      params.getTestDataCategorizationMap()
                          .get(this.replaceDotToDash(subComponentNode.getiPath()));
                  if (subComponentTestDataCategorizationObj != null) {
                    subComponentNode.setTestDataCategorization(
                        subComponentTestDataCategorizationObj.getTestDataCategorization());
                    subComponentNode.setTestDataCategorizationListData(
                        subComponentTestDataCategorizationObj.getListData());
                  }
                }

                componentNode.addChild(subComponentNode);
              }
            }

            fieldNode.addChild(componentNode);

          }
        }

        filedNodes.add(fieldNode);
      }
    }
    return filedNodes;
  }

  private String replaceDotToDash(String iPath) {
    if (iPath != null)
      return iPath.replaceAll("\\.", "\\-");
    return null;
  }

  private Predicate findPredicate(String messageId, Segment segment, Datatype datatype,
      String positionPath, String type, ProfileData profileData) {
    if (type != null && positionPath != null && profileData != null
        && profileData.getIntegrationProfile() != null) {

      IntegrationProfile profile = profileData.getIntegrationProfile();
      if (messageId != null) {
        ConformanceProfile message = profile.findConformanceProfileById(messageId);
        if (message != null && profileData.getConformanceContext() != null
            && profileData.getConformanceContext().getMessagePredicates() != null) {
          for (Predicate p : profileData.getConformanceContext().getMessagePredicates()) {
            if (p.getById() != null
                && p.getById().equals(message.getConformanceProfileMetaData().getId())) {
              if (comparePositionPath(positionPath, p.getTarget(), type, "m"))
                return p;
            }

            if (p.getByName() != null
                && p.getByName().equals(message.getConformanceProfileMetaData().getName())) {
              if (comparePositionPath(positionPath, p.getTarget(), type, "m"))
                return p;
            }
          }
        }
      }

      if (segment != null && profileData.getConformanceContext() != null
          && profileData.getConformanceContext().getSegmentPredicates() != null) {
        for (Predicate p : profileData.getConformanceContext().getSegmentPredicates()) {
          if (p.getById() != null && p.getById().equals(segment.getId())) {
            if (comparePositionPath(positionPath, p.getTarget(), type, "s"))
              return p;
          }

          if (p.getByName() != null && p.getByName().equals(segment.getName())) {
            if (comparePositionPath(positionPath, p.getTarget(), type, "s"))
              return p;
          }
        }
      }

      if (datatype != null && profileData.getConformanceContext() != null
          && profileData.getConformanceContext().getDatatypePredicates() != null) {
        for (Predicate p : profileData.getConformanceContext().getDatatypePredicates()) {
          if (p.getById() != null && p.getById().equals(datatype.getId())) {
            if (comparePositionPath(positionPath, p.getTarget(), type, "d"))
              return p;
          }

          if (p.getByName() != null && p.getByName().equals(datatype.getName())) {
            if (comparePositionPath(positionPath, p.getTarget(), type, "d"))
              return p;
          }
        }
      }

    }
    return null;
  }

  private boolean comparePositionPath(String targetPosition, String predicatePosition,
      String targetType, String predicateLevel) {
    if (predicatePosition == null)
      return false;
    if (targetPosition == null)
      return false;
    String[] predicatePositionSplits = predicatePosition.split("\\.");
    String[] targetPositionSplits = targetPosition.split("\\.");
    if (predicateLevel.equals("m")) {
      if (predicatePositionSplits.length == targetPositionSplits.length) {
        for (int i = 0; i < predicatePositionSplits.length; i++) {
          if (!predicatePositionSplits[i].startsWith(targetPositionSplits[i] + "["))
            return false;
        }
      } else
        return false;
    } else if (predicateLevel.equals("s")) {
      if (targetType.equals("field")) {
        String fieldPositionPredicate = predicatePositionSplits[predicatePositionSplits.length - 1];
        String fieldPositionTarget = targetPositionSplits[targetPositionSplits.length - 1];
        if (!fieldPositionPredicate.startsWith(fieldPositionTarget + "["))
          return false;
      } else if (targetType.equals("component")) {
        if (predicatePositionSplits.length < 2 || targetPositionSplits.length < 2)
          return false;
        String fieldPositionPredicate = predicatePositionSplits[predicatePositionSplits.length - 2];
        String fieldPositionTarget = targetPositionSplits[targetPositionSplits.length - 2];
        String componentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 1];
        String componentPositionTarget = targetPositionSplits[targetPositionSplits.length - 1];
        if (!fieldPositionPredicate.startsWith(fieldPositionTarget + "["))
          return false;
        if (!componentPositionPredicate.startsWith(componentPositionTarget + "["))
          return false;
      } else if (targetType.equals("subComponent")) {
        if (predicatePositionSplits.length < 3 || targetPositionSplits.length < 3)
          return false;
        String fieldPositionPredicate = predicatePositionSplits[predicatePositionSplits.length - 3];
        String fieldPositionTarget = targetPositionSplits[targetPositionSplits.length - 3];
        String componentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 2];
        String componentPositionTarget = targetPositionSplits[targetPositionSplits.length - 2];
        String subComponentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 1];
        String subComponentPositionTarget = targetPositionSplits[targetPositionSplits.length - 1];
        if (!fieldPositionPredicate.startsWith(fieldPositionTarget + "["))
          return false;
        if (!componentPositionPredicate.startsWith(componentPositionTarget + "["))
          return false;
        if (!subComponentPositionPredicate.startsWith(subComponentPositionTarget + "["))
          return false;
      } else
        return false;
    } else if (predicateLevel.equals("d")) {
      if (targetType.equals("component")) {
        String componentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 1];
        String componentPositionTarget = targetPositionSplits[targetPositionSplits.length - 1];
        if (!componentPositionPredicate.startsWith(componentPositionTarget + "["))
          return false;
      } else if (targetType.equals("subComponent")) {
        if (predicatePositionSplits.length < 2 || targetPositionSplits.length < 2)
          return false;
        String componentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 2];
        String componentPositionTarget = targetPositionSplits[targetPositionSplits.length - 2];
        String subComponentPositionPredicate =
            predicatePositionSplits[predicatePositionSplits.length - 1];
        String subComponentPositionTarget = targetPositionSplits[targetPositionSplits.length - 1];
        if (!componentPositionPredicate.startsWith(componentPositionTarget + "["))
          return false;
        if (!subComponentPositionPredicate.startsWith(subComponentPositionTarget + "["))
          return false;
      } else
        return false;
    }
    return true;
  }

  private String findValueByPath(String segmentStr, String path) {
    if (segmentStr != null && path != null) {
      String[] splittedStr = segmentStr.split("\\|");
      String[] splittedPathStr = path.split("\\.");
      String result = null;

      for (int i = 0; i < splittedPathStr.length; i++) {
        int position = Integer.parseInt(splittedPathStr[i]);

        if (i == 0) {
          if (position < splittedStr.length) {
            result = splittedStr[position];
          } else {
            result = "";
          }
          splittedStr = result.split("\\^");
        } else if (i == 1) {
          if (position - 1 < splittedStr.length) {
            result = splittedStr[position - 1];
          } else {
            result = "";
          }
          splittedStr = result.split("\\&");
        } else if (i == 2) {
          if (position - 1 < splittedStr.length) {
            result = splittedStr[position - 1];
          }
        }
      }
      return result;
    }
    return null;
  }

  private void analyzeSegmentRefOrGroup(SegmentRefOrGroup srog, int position, String positionPath,
      String iPositionPath, String path, String iPath, String usagePath, boolean isAnchor,
      ProfileData profileData) {
    if (srog instanceof SegmentRef) {
      SegmentRef sr = (SegmentRef) srog;
      Segment s = profileData.getIntegrationProfile().findSegemntById(sr.getRef());
      if (sr.getMax().equals("1") || isAnchor) {
        int index = 1;
        this.segmentsInfoList.add(this.generateSegmentInfo(index, s, sr, position, positionPath,
            iPositionPath, path, iPath, usagePath, isAnchor));
      } else {
        for (int i = 1; i < this.repeatedNum + 1; i++) {
          this.segmentsInfoList.add(this.generateSegmentInfo(i, s, sr, position, positionPath,
              iPositionPath, path, iPath, usagePath, isAnchor));
        }
      }
    } else if (srog instanceof Group) {
      Group g = (Group) srog;
      String groupName = g.getName().split("\\.")[g.getName().split("\\.").length - 1];
      if (g.getMax().equals("1") || isAnchor) {
        if (positionPath.equals("")) {
          positionPath = "" + position;
          iPositionPath = "" + position + "[1]";
          path = groupName;
          iPath = groupName + "[1]";
          usagePath = g.getUsage().toString();
        } else {
          positionPath = positionPath + "." + position;
          iPositionPath = iPositionPath + "." + position + "[1]";
          path = path + "." + groupName;
          iPath = iPath + "." + groupName + "[1]";
          usagePath = usagePath + "-" + g.getUsage().toString();
        }
        int index = 0;
        for (SegmentRefOrGroup child : g.getChildren()) {
          index = index + 1;
          if(index == 1){
            this.analyzeSegmentRefOrGroup(child, index, positionPath, iPositionPath, path, iPath,
                usagePath, true, profileData);            
          }else {
            this.analyzeSegmentRefOrGroup(child, index, positionPath, iPositionPath, path, iPath,
                usagePath, false, profileData);
          }
          

        }
      } else {
        for (int i = 1; i < this.repeatedNum + 1; i++) {
          String childPositionPath;
          String childiPositionPath;
          String childPath;
          String childiPath;
          String childUsagePath;

          if (positionPath.equals("")) {
            childPositionPath = "" + position;
            childiPositionPath = "" + position + "[" + i + "]";
            childPath = groupName;
            childiPath = groupName + "[" + i + "]";
            childUsagePath = g.getUsage().toString();
          } else {
            childPositionPath = positionPath + "." + position;
            childiPositionPath = iPositionPath + "." + position + "[" + i + "]";
            childPath = path + "." + groupName;
            childiPath = iPath + "." + groupName + "[" + i + "]";
            childUsagePath = usagePath + "-" + g.getUsage().toString();
          }
          int index = 0;
          for (SegmentRefOrGroup child : g.getChildren()) {
            index = index + 1;

            if (index == 1) {
              this.analyzeSegmentRefOrGroup(child, index, childPositionPath, childiPositionPath,
                  childPath, childiPath, childUsagePath, true, profileData);
            } else {
              this.analyzeSegmentRefOrGroup(child, index, childPositionPath, childiPositionPath,
                  childPath, childiPath, childUsagePath, false, profileData);
            }
          }
        }
      }
    }
  }

  private SegmentInfo generateSegmentInfo(int index, Segment s, SegmentRef sr, int position,
      String positionPath, String iPositionPath, String path, String iPath, String usagePath,
      boolean isAnchor) {
    SegmentInfo sInfo = new SegmentInfo();
    sInfo.setAnchor(isAnchor);
    if (positionPath.equals("")) {
      positionPath = "" + position;
      iPositionPath = "" + position + "[" + index + "]";
      path = s.getName();
      iPath = s.getName() + "[" + index + "]";
      usagePath = sr.getUsage().toString();
    } else {
      positionPath = positionPath + "." + position;
      iPositionPath = iPositionPath + "." + position + "[" + index + "]";
      path = path + "." + s.getName();
      iPath = iPath + "." + s.getName() + "[" + index + "]";
      usagePath = usagePath + "-" + sr.getUsage().toString();
    }
    sInfo.setiPath(iPath);
    sInfo.setiPositionPath(iPositionPath);
    sInfo.setMax(sr.getMax());
    sInfo.setName(s.getName());
    sInfo.setPath(path);
    sInfo.setPositionPath(positionPath);
    sInfo.setUsage(sr.getUsage());
    sInfo.setUsagePath(usagePath);
    sInfo.setSegment(s);

    return sInfo;
  }

  private SegmentInfo findSegmentInfo(String segmentName, SegmentInfo anchor) {    
    if (currentPosition >= this.segmentsInfoList.size()) return null;    
    SegmentInfo sInfo = this.segmentsInfoList.get(this.currentPosition);

    
//    if(anchor != null){
//      if(isYourAnchor(anchor, sInfo)) {
//        this.currentPosition = this.currentPosition + 1;
////        return this.findSegmentInfo(segmentName, anchor);
//        if(sInfo.isAnchor()) return this.findSegmentInfo(segmentName, sInfo);
//        else return this.findSegmentInfo(segmentName, anchor);
//      }
//    }
    if (sInfo.getName().equals(segmentName)) {      
      this.currentPosition = this.currentPosition + 1;
      return sInfo;    
    } else {
      this.currentPosition = this.currentPosition + 1;
      if(sInfo.isAnchor()) {
//        System.out.println("-----Missing Anchor----------");
//        
//        
//        
//        System.out.println(this.currentPosition);
//        System.out.println(sInfo);        
        
        skipChildren(sInfo);
        
        
        return this.findSegmentInfo(segmentName, sInfo);
      }else return this.findSegmentInfo(segmentName, anchor);
    }
  }

  /**
   * @param sInfo
   */
  private void skipChildren(SegmentInfo parent) {
    if (currentPosition >= this.segmentsInfoList.size()) return;   
    SegmentInfo child = this.segmentsInfoList.get(this.currentPosition);
    if(isYourChild(parent, child)){
      this.currentPosition = this.currentPosition + 1;
      skipChildren(parent);
    }
  }

  /**
   * @param anchor
   * @param sInfo
   * @return
   */
  private boolean isYourChild(SegmentInfo anchor, SegmentInfo current) {
    if(current.getiPositionPath().startsWith(this.removeLastPath(anchor.getiPositionPath()))) return true;
    return false;
  }

  /**
   * @param getiPositionPath
   * @return
   */
  private String removeLastPath(String iPositionPath) {
    String [] splits = iPositionPath.split("\\.");
    String result = "";
    
    if(splits.length > 1){
      for(int i = 0 ; i < splits.length - 1; i++){
        result = result + "." + splits[i];
      }
    }
    return result.substring(1);
  }

  /**
   * @param params
   * @param findOne
   * @return
   */
  public ConstraintXMLOutPut getConstraintsData(ConstraintParams params, ProfileData profileData) {
    ConstraintXMLOutPut constraintXMLOutPut = new ConstraintXMLOutPut();

    TestStepParams testStepParams = new TestStepParams();
    testStepParams.setConformanceProfileId(params.getConformanceProfileId());
    testStepParams.setEr7Message(params.getEr7Message());
    testStepParams.setIntegrationProfileId(params.getIntegrationProfileId());
    List<SegmentInstanceData> segmentList = this.popSegmentList(testStepParams, profileData);

    if (segmentList != null) {

      for (SegmentInstanceData instanceSegment : segmentList) {
        Segment segment = instanceSegment.getSegmentDef();
        String segName = instanceSegment.getSegmentName();
        String segmentiPath = instanceSegment.getiPath();
        // String segmentiPositionPath = instanceSegment.getPositionIPath();
        String segUsagePath = instanceSegment.getUsagePath();

        DynamicInfo dynamicInfo = this.findDynamicInfo(segment, instanceSegment.getLineStr());

        for (int i = 0; i < segment.getChildren().size(); i++) {
          Field field = segment.getChildren().get(i);
          String wholeFieldStr = this.getFieldStrFromSegment(segName, instanceSegment, (i + 1));
          int fieldRepeatIndex = 0;

          String fieldUsagePath = segUsagePath + '-' + field.getUsage();
          for (int j = 0; j < wholeFieldStr.split("\\~").length; j++) {
            String fieldStr = wholeFieldStr.split("\\~")[j];
            Datatype fieldDT =
                profileData.getIntegrationProfile().findDatatypeById(field.getDatatypeId());

            if (dynamicInfo != null && dynamicInfo.getDynamicMappingTarget() != null
                && dynamicInfo.getDynamicMappingTarget().equals("" + (i + 1))
                && dynamicInfo.getDynamicMappingDatatypeId() != null) {
              fieldDT = profileData.getIntegrationProfile()
                  .findDatatypeById(dynamicInfo.getDynamicMappingDatatypeId());
            }

            if (segName == "MSH" && (i + 1) == 1) {
              fieldStr = "|";
            }
            if (segName == "MSH" && (i + 1) == 2) {
              fieldStr = "^~\\&";
            }
            fieldRepeatIndex = fieldRepeatIndex + 1;
            String fieldiPath = "." + (i + 1) + "[" + fieldRepeatIndex + "]";

            if (fieldDT == null || fieldDT.getChildren() == null
                || fieldDT.getChildren().size() == 0) {
              // Categorization cateOfField = params.getTestDataCategorizationMap()
              // .get(this.replaceDot2Dash(segmentiPath + fieldiPath));
              constraintXMLOutPut.getCategorizationsDataMap()
                  .put(this.replaceDot2Dash(segmentiPath + fieldiPath), fieldStr);
              constraintXMLOutPut.getCategorizationsUsageMap()
                  .put(this.replaceDot2Dash(segmentiPath + fieldiPath), fieldUsagePath);
            } else {
              for (int k = 0; k < fieldDT.getChildren().size(); k++) {
                Component c = fieldDT.getChildren().get(k);
                String componentUsagePath = fieldUsagePath + '-' + c.getUsage();
                String componentiPath = "." + (k + 1) + "[1]";

                String componentStr = this.getComponentStrFromField(fieldStr, (k + 1));
                Datatype componentDT =
                    profileData.getIntegrationProfile().findDatatypeById(c.getDatatypeId());
                if (componentDT == null || componentDT.getChildren() == null
                    || componentDT.getChildren().size() == 0) {
                  // Categorization cateOfComponent = params.getTestDataCategorizationMap()
                  // .get(this.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath));
                  constraintXMLOutPut.getCategorizationsDataMap().put(
                      this.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath),
                      componentStr);
                  constraintXMLOutPut.getCategorizationsUsageMap().put(
                      this.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath),
                      componentUsagePath);
                } else {
                  for (int l = 0; l < componentDT.getChildren().size(); l++) {
                    Component sc = componentDT.getChildren().get(l);
                    String subComponentUsagePath = componentUsagePath + '-' + sc.getUsage();
                    String subcomponentiPath = "." + (l + 1) + "[1]";
                    String subcomponentStr =
                        this.getSubComponentStrFromField(componentStr, (l + 1));
                    // Categorization cateOfSubComponent = params.getTestDataCategorizationMap()
                    // .get(this.replaceDot2Dash(segmentiPath + fieldiPath + componentiPath
                    // + subcomponentiPath));
                    constraintXMLOutPut.getCategorizationsDataMap().put(
                        this.replaceDot2Dash(
                            segmentiPath + fieldiPath + componentiPath + subcomponentiPath),
                        subcomponentStr);
                    constraintXMLOutPut.getCategorizationsUsageMap().put(
                        this.replaceDot2Dash(
                            segmentiPath + fieldiPath + componentiPath + subcomponentiPath),
                        subComponentUsagePath);
                  }
                }
              }
            }
          }
        }
      }
      return constraintXMLOutPut;
    }
    return null;
  }
}
