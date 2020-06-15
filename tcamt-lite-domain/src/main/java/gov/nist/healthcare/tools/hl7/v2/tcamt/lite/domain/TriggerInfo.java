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
package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.util.ArrayList;
import java.util.List;

/**
 * @author jungyubw
 *
 */
public class TriggerInfo {

	private String description;
	private Operation operation;
	private List<TriggerPath> list = new ArrayList<TriggerPath>();

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Operation getOperation() {
		return operation;
	}

	public void setOperation(Operation operation) {
		this.operation = operation;
	}

	public List<TriggerPath> getList() {
		return list;
	}

	public void setList(List<TriggerPath> list) {
		this.list = list;
	}

	@Override
	public String toString() {
		return "TriggerInfo [description=" + description + ", operation=" + operation + ", list=" + list + "]";
	}

}
