package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.config;

import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;

import gov.nist.hit.resources.deploy.client.SSLHL7v2ResourceClient;
import gov.nist.hit.resources.deploy.exception.InsupportedApiMethod;
import gov.nist.hit.resources.deploy.model.ResourceType;

public class RemoveTps {

	public static void main(String[] args) throws KeyManagementException, NoSuchAlgorithmException, KeyStoreException, IOException, InsupportedApiMethod {
		// TODO Auto-generated method stub
		
		
		SSLHL7v2ResourceClient client = new SSLHL7v2ResourceClient("https://hit-dev.nist.gov:8099/gvt", "wakili", "Ae725055");
		client.delete(12L, ResourceType.TEST_PLAN);
		client.delete(8863092376288428032L, ResourceType.TEST_PLAN);
		client.delete(1123989L, ResourceType.TEST_PLAN);



	}

}
