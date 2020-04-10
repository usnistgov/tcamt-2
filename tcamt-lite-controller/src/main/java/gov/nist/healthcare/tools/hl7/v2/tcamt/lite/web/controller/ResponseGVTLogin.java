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
package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.web.controller;

import java.util.Set;

import org.springframework.http.ResponseEntity;

import gov.nist.hit.resources.deploy.model.Domain;
import gov.nist.hit.resources.deploy.model.RegistredGrant;

/**
 * @author jungyubw
 *
 */
public class ResponseGVTLogin {

  private Set<RegistredGrant> registeredGrants;
  private ResponseEntity<Domain[]> domains;
  public Set<RegistredGrant> getRegisteredGrants() {
    return registeredGrants;
  }
  public void setRegisteredGrants(Set<RegistredGrant> registeredGrants) {
    this.registeredGrants = registeredGrants;
  }
  public ResponseEntity<Domain[]> getDomains() {
    return domains;
  }
  public void setDomains(ResponseEntity<Domain[]> domains) {
    this.domains = domains;
  }
  
  
}
