package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

public class TestStroyEntry {
	private String id;
	private int position;
	private String title;
	private boolean present;
	private String scope;
	private boolean summaryEntry;

	public TestStroyEntry() {
		super();
	}
	
	public TestStroyEntry(String id, int position,String scope, String title, boolean present, boolean summaryEntry) {
		this.position = position;
		this.scope=scope;
		this.title = title;
		this.id = id;
		this.present = present;
		this.setSummaryEntry(summaryEntry);
	}

	public int getPosition() {
		return position;
	}

	public void setPosition(int position) {
		this.position = position;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public boolean isPresent() {
		return present;
	}

	public void setPresent(boolean present) {
		this.present = present;
	}

	public String getScope() {
		return scope;
	}

	public void setScope(String scope) {
		this.scope = scope;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public boolean isSummaryEntry() {
		return summaryEntry;
	}

	public void setSummaryEntry(boolean summaryEntry) {
		this.summaryEntry = summaryEntry;
	}

}
