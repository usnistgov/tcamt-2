package gov.nist.healthcare.tools.hl7.v2.tcamt.lite.domain;

public class ConnectApp {

  String url;
  int position;
  public int getPosition() {
	return position;
}

public void setPosition(int position) {
	this.position = position;
}

String name;

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public ConnectApp(String name, String url, int position) {
    this.name = name;
    this.url = url;
    this.position=position;
  }

  public ConnectApp() {
    super();
    // TODO Auto-generated constructor stub
  }



}
