package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

import java.util.ArrayList;
import java.util.List;

import javax.persistence.Id;

import org.bson.types.ObjectId;

public class SegmentTemplate {
	@Id
	private String id;

	private String name;
	private String description;
	private String date;
	
	private String segmentName;
	
	private List<Categorization> categorizations = new ArrayList<Categorization>();
	
	public SegmentTemplate() {
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

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getDate() {
		return date;
	}

	public void setDate(String date) {
		this.date = date;
	}

	public String getSegmentName() {
		return segmentName;
	}

	public void setSegmentName(String segmentName) {
		this.segmentName = segmentName;
	}

	public List<Categorization> getCategorizations() {
		return categorizations;
	}

	public void setCategorizations(List<Categorization> categorizations) {
		this.categorizations = categorizations;
	}
	
	
}
