/**
 * This software was developed at the National Institute of Standards and Technology by employees
 * of the Federal Government in the course of their official duties. Pursuant to title 17 Section 105 of the
 * United States Code this software is not subject to copyright protection and is in the public domain.
 * This is an experimental system. NIST assumes no responsibility whatsoever for its use by other parties,
 * and makes no guarantees, expressed or implied, about its quality, reliability, or any other characteristic.
 * We would appreciate acknowledgement if the software is used. This software can be redistributed and/or
 * modified freely provided that any derivative works bear some notice that they are derived from it, and any
 * modified versions bear some notice that they have been modified.
 */

/**
 * 
 * @author Olivier MARIE-ROSE
 * 
 */

package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.impl;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mongodb.MongoException;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.Template;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.repo.TemplateRepository;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TemplateService;

@Service
public class TemplateServiceImpl implements TemplateService {
	Logger log = LoggerFactory.getLogger(TemplateServiceImpl.class);
	@Autowired
	private TemplateRepository templateRepository;

	@Override
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public Template save(Template t) {
		try {
			return templateRepository.save(t);
		} catch (MongoException e) {
			throw e;
		}
	}
	
	@Override
	public Template findByAccountId(Long accountId) {
		List<Template> templates = templateRepository.findByAccountId(accountId);
		if(templates.size() == 0) {
			Template t = new Template();
			t.setAccountId(accountId);
			t.setName("My Template");
			t.setNote("No note");
			
			return t;
		}
		return templates.get(0);
	}
	
	@Override
    public List<Template> findAll() {
        List<Template> templates = templateRepository.findAll();
        log.info("templates=" + templates.size());
        return templates;
    }

}
