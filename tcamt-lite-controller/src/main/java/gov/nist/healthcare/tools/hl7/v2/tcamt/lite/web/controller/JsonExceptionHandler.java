/**
 * This software was developed at the National Institute of Standards and Technology by employees
 * of the Federal Government in the course of their official duties. Pursuant to title 17 Section 105 of the
 * United States Code this software is not subject to copyright protection and is in the public domain.
 * This is an experimental system. NIST assumes no responsibility whatsoever for its use by other parties,
 * and makes no guarantees, expressed or implied, about its quality, reliability, or any other characteristic.
 * We would appreciate acknowledgment if the software is used. This software can be redistributed and/or
 * modified freely provided that any derivative works bear some notice that they are derived from it, and any
 * modified versions bear some notice that they have been modified.
 * */
package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import gov.nist.healthcare.nht.acmgt.dto.ResponseMessage;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanDeleteException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanListException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanNotFoundException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service.TestPlanSaveException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.OperationNotAllowException;
import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.exception.UserAccountNotFoundException;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.codehaus.jackson.map.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.servlet.ModelAndView;

/**
 * Called when an exception occurs during request processing. Transforms the
 * exception message into JSON format.
 */
@Component
public class JsonExceptionHandler implements HandlerExceptionResolver {
	private final ObjectMapper mapper = new ObjectMapper();

	static final Logger logger = LoggerFactory
			.getLogger(JsonExceptionHandler.class);

	@Override
	public ModelAndView resolveException(HttpServletRequest request,
			HttpServletResponse response, Object handler, Exception ex) {
		try {
			if (ex instanceof AccessDeniedException) {
				logger.error("ERROR: Access Denied", ex);
				response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
				mapper.writeValue(response.getWriter(), new ResponseMessage(
						ResponseMessage.Type.danger, "accessDenied"));
			} else if (ex instanceof UserAccountNotFoundException) {
				logger.error("ERROR: User account not found", ex);
				response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
				mapper.writeValue(response.getWriter(), new ResponseMessage(
						ResponseMessage.Type.danger, "accountNotFound", null));
			} else if (ex instanceof TestPlanNotFoundException) {
				logger.error("ERROR: document not found", ex);
				response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
				mapper.writeValue(response.getWriter(), new ResponseMessage(
						ResponseMessage.Type.danger, "TestPlanNotFoundException"));
			} else if (ex instanceof TestPlanSaveException) {
				logger.error("ERROR: Access Denied", ex);
				response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
				mapper.writeValue(response.getWriter(), new ResponseMessage(
						ResponseMessage.Type.danger, "TestPlanSaveException"));
			} else if (ex instanceof TestPlanDeleteException) {
				logger.error("ERROR: Access Denied", ex);
				response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
				mapper.writeValue(response.getWriter(), new ResponseMessage(
						ResponseMessage.Type.danger, "TestPlanDeleteException"));
			} else if (ex instanceof OperationNotAllowException) {
				logger.error("ERROR: Access Denied", ex);
				response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
				mapper.writeValue(response.getWriter(), new ResponseMessage(
						ResponseMessage.Type.danger, "OperationNotAllowException"));
			} else if (ex instanceof TestPlanException) {
				logger.error("ERROR: Access Denied", ex);
				response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
				mapper.writeValue(response.getWriter(), new ResponseMessage(
						ResponseMessage.Type.danger, "TestPlanException"));
			} else if (ex instanceof TestPlanListException) {
				logger.error("ERROR: Access Denied", ex);
				response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
				mapper.writeValue(response.getWriter(), new ResponseMessage(
						ResponseMessage.Type.danger, "TestPlanListException"));
			} else {
				logger.error("ERROR: " + ex.getMessage(), ex);
				response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
				mapper.writeValue(response.getWriter(), new ResponseMessage(
						ResponseMessage.Type.danger, "internalError"));
			}
		} catch (IOException e) {
			// give up
			logger.error("ERROR: GAVE UP: " + e.getMessage(), e);
		}
		return new ModelAndView();
	}

}
