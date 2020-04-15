package gov.nist.hit.hl7.tcamt.webapp;

import gov.nist.hit.hl7.tcamt.backend.util.*;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/appInfo")
public class AppInfoController {

	@Autowired
	private AppInfo appInfo;

	@RequestMapping(method = RequestMethod.GET)
	public AppInfo info(HttpServletRequest request) {
		if (appInfo.getUploadedImagesUrl() == null) {
			appInfo.setUploadedImagesUrl(HttpUtil.getImagesRootUrl(request));
		}
		return appInfo;
	}
}
