package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.HashSet;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Slide;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.TcamtDocument;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.UserGuide;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo.TcamtDocumentRepository;

@RestController
@RequestMapping("/tcamtdocument")
public class TcamtDocumentController extends CommonController {

  @Autowired
  TcamtDocumentRepository tcamtDocumentRepository;

  @RequestMapping(method = RequestMethod.GET, produces = "application/json")
  public TcamtDocument getTcamtDocument() throws Exception {

    List<TcamtDocument> docs = this.tcamtDocumentRepository.findAll();
    if(docs != null && docs.size() > 0) {
      TcamtDocument result = docs.get(0);
      
      if (result.getHelpGuide() == null || result.getHelpGuide().getSlides() == null || result.getHelpGuide().getSlides().size() == 0) {
        result.setHelpGuide(new UserGuide());
        result.getHelpGuide().setSlides(new HashSet<Slide>());
        Slide helpSlide0 = new Slide();
        helpSlide0.setPosition(0);
        helpSlide0.setTitle("Create New TestPlan");
        result.getHelpGuide().getSlides().add(helpSlide0);
        
        Slide helpSlide1 = new Slide();
        helpSlide1.setPosition(1);
        helpSlide1.setTitle("Import Public Profile");
        result.getHelpGuide().getSlides().add(helpSlide1);
        
        Slide helpSlide2 = new Slide();
        helpSlide2.setPosition(2);
        helpSlide2.setTitle("Import TestPlan JSON");
        result.getHelpGuide().getSlides().add(helpSlide2);
        
        Slide helpSlide3 = new Slide();
        helpSlide3.setPosition(3);
        helpSlide3.setTitle("Import Implementation Guide (XML)");
        result.getHelpGuide().getSlides().add(helpSlide3);
        
        Slide helpSlide4 = new Slide();
        helpSlide4.setPosition(4);
        helpSlide4.setTitle("Replace XML Profile");
        result.getHelpGuide().getSlides().add(helpSlide4);
        
        Slide helpSlide5 = new Slide();
        helpSlide5.setPosition(5);
        helpSlide5.setTitle("Replace Public Profile");
        result.getHelpGuide().getSlides().add(helpSlide5);
        
        Slide helpSlide6 = new Slide();
        helpSlide6.setPosition(6);
        helpSlide6.setTitle("Edit Test Story Template");
        result.getHelpGuide().getSlides().add(helpSlide6);
      }
      
      return result;
    }else {
      TcamtDocument result = new TcamtDocument();
      result.setUserGuide(new UserGuide());
      result.getUserGuide().setSlides(new HashSet<Slide>());
      Slide slide = new Slide();
      slide.setPosition(0);
      slide.setTitle("New Slide");
      result.getUserGuide().getSlides().add(slide);
      
      result.setHelpGuide(new UserGuide());
      result.getHelpGuide().setSlides(new HashSet<Slide>());
      Slide helpSlide0 = new Slide();
      helpSlide0.setPosition(0);
      helpSlide0.setTitle("Create New TestPlan");
      result.getHelpGuide().getSlides().add(helpSlide0);
      
      Slide helpSlide1 = new Slide();
      helpSlide1.setPosition(1);
      helpSlide1.setTitle("Import Public Profile");
      result.getHelpGuide().getSlides().add(helpSlide1);
      
      Slide helpSlide2 = new Slide();
      helpSlide2.setPosition(2);
      helpSlide2.setTitle("Import TestPlan JSON");
      result.getHelpGuide().getSlides().add(helpSlide2);
      
      Slide helpSlide3 = new Slide();
      helpSlide3.setPosition(3);
      helpSlide3.setTitle("Import Implementation Guide (XML)");
      result.getHelpGuide().getSlides().add(helpSlide3);
      
      Slide helpSlide4 = new Slide();
      helpSlide4.setPosition(4);
      helpSlide4.setTitle("Replace XML Profile");
      result.getHelpGuide().getSlides().add(helpSlide4);
      
      Slide helpSlide5 = new Slide();
      helpSlide5.setPosition(5);
      helpSlide5.setTitle("Replace Public Profile");
      result.getHelpGuide().getSlides().add(helpSlide5);
      
      Slide helpSlide6 = new Slide();
      helpSlide6.setPosition(6);
      helpSlide6.setTitle("Edit Test Story Template");
      result.getHelpGuide().getSlides().add(helpSlide6);
      
      return result;
    }
  }

  @RequestMapping(value = "/save", method = RequestMethod.POST)
  public void saveTcamtDocument(@RequestBody TcamtDocument doc) throws Exception {
    this.tcamtDocumentRepository.save(doc);
  }
}
