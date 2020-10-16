package gov.nist.hit.hl7.tcamt.auth.client.service.impl;

import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;

import javax.annotation.PostConstruct;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.TrustAllStrategy;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContextBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import gov.nist.hit.hl7.auth.util.crypto.SecurityConstants;
import gov.nist.hit.hl7.auth.util.requests.ChangePasswordConfirmRequest;
import gov.nist.hit.hl7.auth.util.requests.ChangePasswordRequest;
import gov.nist.hit.hl7.auth.util.requests.ConnectionResponseMessage;
import gov.nist.hit.hl7.auth.util.requests.LoginRequest;
import gov.nist.hit.hl7.auth.util.requests.PasswordResetTokenResponse;
import gov.nist.hit.hl7.auth.util.requests.RegistrationRequest;
import gov.nist.hit.hl7.auth.util.requests.UserResponse;
import gov.nist.hit.hl7.tcamt.auth.client.exception.AuthenticationException;
import gov.nist.hit.hl7.tcamt.auth.client.service.AuthenticationService;

import java.nio.charset.StandardCharsets;
import com.google.common.hash.Hashing;

@Service
public class AuthenticationServiceImpl implements AuthenticationService {

  @Autowired
  Environment env;

  private static final String AUTH_URL = "auth.url";
  private static final String AUTH_URL_VALIDATE_TOKEN = "auth.validatetoken";
  private static final String AUTH_URL_RESET_PASSWORD_CONFIRM = "auth.resetpasswordconfirm";


  RestTemplate restTemplate;

  static {
    disableSslVerification();
  }

  private static void disableSslVerification() {
    try {
      // Create a trust manager that does not validate certificate chains
      TrustManager[] trustAllCerts = new TrustManager[] {new X509TrustManager() {
        @Override
        public java.security.cert.X509Certificate[] getAcceptedIssuers() {
          return null;
        }

        @Override
        public void checkClientTrusted(X509Certificate[] certs, String authType) {}

        @Override
        public void checkServerTrusted(X509Certificate[] certs, String authType) {}
      }};

      // Install the all-trusting trust manager
      SSLContext sc = SSLContext.getInstance("SSL");
      sc.init(null, trustAllCerts, new java.security.SecureRandom());
      HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

      // Create all-trusting host name verifier
      HostnameVerifier allHostsValid = new HostnameVerifier() {

        @Override
        public boolean verify(String hostname, SSLSession session) {
          return true;
        }
      };

      // Install the all-trusting host verifier
      HttpsURLConnection.setDefaultHostnameVerifier(allHostsValid);
    } catch (NoSuchAlgorithmException e) {
      e.printStackTrace();
    } catch (KeyManagementException e) {
      e.printStackTrace();
    }
  }

  @PostConstruct
  @SuppressWarnings("deprecation")
  public void init() {
    try {
      SSLContextBuilder builder = new SSLContextBuilder();
      builder.loadTrustMaterial(null, new TrustAllStrategy());
      SSLConnectionSocketFactory socketFactory = new SSLConnectionSocketFactory(builder.build(),
          SSLConnectionSocketFactory.ALLOW_ALL_HOSTNAME_VERIFIER);
      CloseableHttpClient httpClient = HttpClients.custom().setSSLSocketFactory(socketFactory)
          .setHostnameVerifier(SSLConnectionSocketFactory.ALLOW_ALL_HOSTNAME_VERIFIER).build();
      HttpComponentsClientHttpRequestFactory fct =
          new HttpComponentsClientHttpRequestFactory(httpClient);
      this.restTemplate = new RestTemplate(fct);
    } catch (KeyManagementException | NoSuchAlgorithmException | KeyStoreException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    }
  }


  @Override
  public ConnectionResponseMessage<UserResponse> connect(HttpServletResponse response,
      LoginRequest user) throws AuthenticationException {
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.add("Content-type", "application/json");
      HttpEntity<LoginRequest> request = new HttpEntity<>(user);
      if (user.getOldMethod()) {
        String sha256hex = Hashing.sha256()
          .hashString(user.getPassword() + "{" + user.getUsername() + "}", StandardCharsets.UTF_8)
          .toString();
        user.setPassword(sha256hex);
      }
      System.out.println(env.getProperty(AUTH_URL));
      ResponseEntity<ConnectionResponseMessage<UserResponse>> call =
          restTemplate.exchange(env.getProperty(AUTH_URL) + "/api/tool/login", HttpMethod.POST, request,
              new ParameterizedTypeReference<ConnectionResponseMessage<UserResponse>>() {});
      call.getBody().setHide(true);
      if (call.getStatusCode() == HttpStatus.OK) {
        if (call.getHeaders().containsKey("Authorization")) {
          headers.add(HttpHeaders.CONTENT_TYPE, "application/json; charset=UTF-8");
          Cookie authCookie =
              new Cookie("authCookie", call.getHeaders().get("Authorization").get(0));
          authCookie.setPath("/api");
          authCookie.setMaxAge(SecurityConstants.EXPIRATION_DATE - 20);
          response.setContentType("application/json");
          response.addCookie(authCookie);
          return call.getBody();
        } else {
          throw new AuthenticationException("Token is missing");
        }
      } else {
        throw new AuthenticationException("Unautorized");
      }
    } catch (HttpClientErrorException e) {
      String message = e.getResponseBodyAsString();
      throw new AuthenticationException(getMessageString(message));
    } catch (HttpServerErrorException e) {
      String message = e.getResponseBodyAsString();

      throw new AuthenticationException(getMessageString(message));
    } catch (Exception e) {
      throw new AuthenticationException(e.getMessage());
    }
  }

  @Override
  public ConnectionResponseMessage<UserResponse> register(RegistrationRequest user)
      throws AuthenticationException {

    try {
      HttpHeaders headers = new HttpHeaders();
      headers.add("Content-type", "application/json");
      RestTemplate restTemplate = new RestTemplate();
      HttpEntity<RegistrationRequest> request = new HttpEntity<>(user);


      ResponseEntity<ConnectionResponseMessage<UserResponse>> response =
          restTemplate.exchange(env.getProperty(AUTH_URL) + "/api/tool/register", HttpMethod.POST, request,
              new ParameterizedTypeReference<ConnectionResponseMessage<UserResponse>>() {});



      return response.getBody();
    } catch (HttpClientErrorException e) {
      String message = e.getResponseBodyAsString();

      throw new AuthenticationException(getMessageString(message));
    }


    catch (HttpServerErrorException e) {
      String message = e.getResponseBodyAsString();

      throw new AuthenticationException(getMessageString(message));
    } catch (Exception e) {
      e.printStackTrace();
      throw new AuthenticationException(e.getMessage());
    }
  }


  @Override
  public ConnectionResponseMessage<PasswordResetTokenResponse> requestPasswordChange(String email)
      throws AuthenticationException {
    // TODO Auto-generated method stub
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.add("Content-type", "application/json");
      RestTemplate restTemplate = new RestTemplate();
      ChangePasswordRequest changePasswordRequest = new ChangePasswordRequest();
      changePasswordRequest.setEmail(email);
      HttpEntity<ChangePasswordRequest> request =
          new HttpEntity<ChangePasswordRequest>(changePasswordRequest);
      ResponseEntity<ConnectionResponseMessage<PasswordResetTokenResponse>> response = restTemplate
          .exchange(env.getProperty(AUTH_URL) + "/api/tool/password/reset", HttpMethod.POST, request,
              new ParameterizedTypeReference<ConnectionResponseMessage<PasswordResetTokenResponse>>() {});
      return response.getBody();
    } catch (HttpClientErrorException e) {
      String message = e.getResponseBodyAsString();
      throw new AuthenticationException(getMessageString(message));
    } catch (HttpServerErrorException e) {
      String message = e.getResponseBodyAsString();

      throw new AuthenticationException(getMessageString(message));
    } catch (Exception e) {
      throw new AuthenticationException(e.getMessage());
    }
  }

  @Override
  public boolean validateToken(String token) throws AuthenticationException {
    // TODO Auto-generated method stub
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.add("Content-type", "application/json");
      RestTemplate restTemplate = new RestTemplate();

      HttpEntity<String> request = new HttpEntity<String>(token);
      ResponseEntity<Boolean> response =
          restTemplate.exchange(env.getProperty(AUTH_URL) + "/api/tool/password/validatetoken",
              HttpMethod.POST, request, Boolean.class);
      return response.getBody();
    } catch (HttpClientErrorException e) {
      String message = e.getResponseBodyAsString();

      throw new AuthenticationException(getMessageString(message));
    }


    catch (HttpServerErrorException e) {
      String message = e.getResponseBodyAsString();

      throw new AuthenticationException(getMessageString(message));
    }

    catch (Exception e) {
      e.printStackTrace();
      throw new AuthenticationException(e.getMessage());
    }
  }

  @Override
  public ConnectionResponseMessage<PasswordResetTokenResponse> confirmChangePassword(
      ChangePasswordConfirmRequest requestObject) throws AuthenticationException {
    // TODO Auto-generated method stub
    try {
      HttpHeaders headers = new HttpHeaders();
      headers.add("Content-type", "application/json");
      RestTemplate restTemplate = new RestTemplate();
      HttpEntity<ChangePasswordConfirmRequest> request =
          new HttpEntity<ChangePasswordConfirmRequest>(requestObject);
      ResponseEntity<ConnectionResponseMessage<PasswordResetTokenResponse>> response = restTemplate
          .exchange(env.getProperty(AUTH_URL) + "/api/tool/password/reset/confirm", HttpMethod.POST, request,
              new ParameterizedTypeReference<ConnectionResponseMessage<PasswordResetTokenResponse>>() {});
      return response.getBody();

    } catch (HttpClientErrorException e) {
      String message = e.getResponseBodyAsString();

      throw new AuthenticationException(getMessageString(message));
    }


    catch (HttpServerErrorException e) {
      String message = e.getResponseBodyAsString();

      throw new AuthenticationException(getMessageString(message));
    }

    catch (Exception e) {
      e.printStackTrace();
      throw new AuthenticationException(e.getMessage());
    }
  }

  /*
   * (non-Javadoc)
   * 
   * @see
   * gov.nist.hit.hl7.tcamt.auth.client.service.AuthenticationService#getAuthentication(org.springframework
   * .security.core.Authentication)
   */
  @Override
  public UserResponse getAuthentication(Authentication authentication) {
    UserResponse response = new UserResponse();

    if (authentication != null && !(authentication instanceof AnonymousAuthenticationToken)) {
      response.setUsername(authentication.getName());
      for (GrantedAuthority auth : authentication.getAuthorities()) {
        response.addAuthority(auth);
      }
    } else {
      response.setUsername("Guest");
    }
    return response;
  }

  private String getMessageString(String string) throws AuthenticationException {

    ObjectMapper mapper = new ObjectMapper().configure(
        com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    try {
      ConnectionResponseMessage<Object> obj =
          mapper.readValue(string, new TypeReference<ConnectionResponseMessage<Object>>() {});
      return obj.getText();
    } catch (IOException e) {
      // TODO Auto-generated catch block
      throw new AuthenticationException("Could not parse the error response");
    }
  }


}
