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
 * @author Jungyub Woo
 * 
 */

package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.service;

import java.util.List;

import org.springframework.stereotype.Service;

import gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain.profile.ProfileData;

@Service
public interface ProfileService {
	
	public ProfileData save(ProfileData data) throws Exception;

	public void delete(String id);

	public ProfileData findOne(String id);

	public List<ProfileData> findAll();

	public List<ProfileData> findByAccountId(Long accountId);
	
	public List<ProfileData> findByAccountIdAndSourceType(Long accountId, String sourceType);
	
}
