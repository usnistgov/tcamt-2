package gov.nist.hit.hl7.tcamt.webapp;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;

import gov.nist.hit.hl7.tcamt.backend.domain.*;

@org.springframework.stereotype.Component
@PropertySource(value = "classpath:application.yml")
public class AppInfo implements Serializable {

	private static final long serialVersionUID = 8805967508478985159L;

	@Value("${app.version}")
	private String version;

	@Value("${app.date}")
	private String date;

	private String uploadedImagesUrl;

	@Value("${admin.email}")
	private String adminEmail;
	
	@Value("${connect.uploadTokenContext}")
	private String connectUploadTokenContext;
	
	private Set<ConnectApp> connectApps = new HashSet<ConnectApp>();
	
	public Set<ConnectApp> getConnectApps() {
		return connectApps;
	}

	public void setConnectApps(Set<ConnectApp> connectApps) {
		this.connectApps = connectApps;
	}

	@Value("${connect.apps}")
	private String connectAppsString;
	
	public String getConnectAppsString() {
		return connectAppsString;
	}

	public void setConnectAppsString(String connectAppsString) {
		this.connectAppsString = connectAppsString;
	}

	public String getConnectUploadTokenContext() {
		return connectUploadTokenContext;
	}

	public void setConnectUploadTokenContext(String connectUploadTokenContext) {
		this.connectUploadTokenContext = connectUploadTokenContext;
	}


	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}

	public String getDate() {
		return date;
	}

	public void setDate(String date) {
		this.date = date;
	}

	public String getAdminEmail() {
		return adminEmail;
	}

	public void setAdminEmail(String adminEmail) {
		this.adminEmail = adminEmail;
	}

	public String getUploadedImagesUrl() {
		return uploadedImagesUrl;
	}

	public void setUploadedImagesUrl(String uploadedImagesUrl) {
		this.uploadedImagesUrl = uploadedImagesUrl;
	}

    @PostConstruct
    public void init() throws Exception {

        String[] apps = this.connectAppsString.split(";");
        if (apps != null && apps.length > 0) {
            for (int i=0; i<apps.length; i++) {
                String[] prop = apps[i].split(Pattern.quote("|"));
                this.connectApps.add(new ConnectApp(prop[0], prop[1], i+1));
            }
        }

    }

}
