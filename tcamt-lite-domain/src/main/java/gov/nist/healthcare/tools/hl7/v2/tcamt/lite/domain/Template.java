package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.Id;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "template")
public class Template implements Serializable, Cloneable {


	/**
	 * 
	 */
	private static final long serialVersionUID = 6206588436404241157L;

	@Id
	private String id;

	private String name;
	private String note;
	private Set<ER7Template> er7Templates = new HashSet<ER7Template>(); 
	private Set<MessageTemplate> messageTemplates = new HashSet<MessageTemplate>();
	private Set<SegmentTemplate> segmentTemplates = new HashSet<SegmentTemplate>();
	private Set<Er7SegmentTemplate> er7segmentTemplates= new HashSet<Er7SegmentTemplate>();
	private Long accountId;

	
	public Template() {
		super();
		
		this.id = ObjectId.get().toString();
	}


	public String getId() {
		return id;
	}


	public void setId(String id) {
		this.id = id;
	}


	public String getName() {
		return name;
	}


	public void setName(String name) {
		this.name = name;
	}


	public String getNote() {
		return note;
	}


	public void setNote(String note) {
		this.note = note;
	}

	public Long getAccountId() {
		return accountId;
	}


	public void setAccountId(Long accountId) {
		this.accountId = accountId;
	}


	public Set<MessageTemplate> getMessageTemplates() {
		return messageTemplates;
	}


	public void setMessageTemplates(Set<MessageTemplate> messageTemplates) {
		this.messageTemplates = messageTemplates;
	}


	public Set<SegmentTemplate> getSegmentTemplates() {
		return segmentTemplates;
	}


	public void setSegmentTemplates(Set<SegmentTemplate> segmentTemplates) {
		this.segmentTemplates = segmentTemplates;
	}


	public Set<ER7Template> getEr7Templates() {
		return er7Templates;
	}


	public void setEr7Templates(Set<ER7Template> er7Templates) {
		this.er7Templates = er7Templates;
	}


	public Set<Er7SegmentTemplate> getEr7segmentTemplates() {
		return er7segmentTemplates;
	}


	public void setEr7segmentTemplates(Set<Er7SegmentTemplate> er7segmentTemplates) {
		this.er7segmentTemplates = er7segmentTemplates;
	}

	
	

	
}
