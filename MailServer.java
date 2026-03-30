import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;

import java.util.Properties;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

public class MailServer {
    
    // BURAYA KENDİ GMAIL ADRESİNİZİ VE UYGULAMA ŞİFRENİZİ GİRMELİSİNİZ
    private static final String SENDER_EMAIL = "sizin_mailiniz@gmail.com";
    private static final String SENDER_PASSWORD = "sizin_uygulama_sifreniz";

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8000), 0);
        server.createContext("/send-email", new EmailHandler());
        server.setExecutor(null);
        server.start();
        System.out.println("Java E-Posta Sunucusu basladi: http://localhost:8000/send-email");
        System.out.println("Lutfen MailServer.java dosyasini acip SENDER_EMAIL ve SENDER_PASSWORD alanlarini doldurun.");
    }

    static class EmailHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // CORS Ayarları
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equals(exchange.getRequestMethod())) {
                InputStream is = exchange.getRequestBody();
                String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                
                // Basit JSON parse (Örn {"to":"x@y.com", "code":"123456"})
                String toEmail = extractJsonValue(body, "to");
                String code = extractJsonValue(body, "code");

                try {
                    sendEmail(toEmail, code);
                    String response = "{\"status\":\"success\"}";
                    exchange.sendResponseHeaders(200, response.length());
                    OutputStream os = exchange.getResponseBody();
                    os.write(response.getBytes());
                    os.close();
                } catch (Exception e) {
                    e.printStackTrace();
                    String response = "{\"status\":\"error\", \"message\":\"" + e.getMessage() + "\"}";
                    exchange.sendResponseHeaders(500, response.length());
                    OutputStream os = exchange.getResponseBody();
                    os.write(response.getBytes());
                    os.close();
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    private static String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\":\"";
        int start = json.indexOf(searchKey);
        if (start == -1) return "";
        start += searchKey.length();
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }

    private static void sendEmail(String to, String otpCode) throws MessagingException {
        Properties prop = new Properties();
        prop.put("mail.smtp.host", "smtp.gmail.com");
        prop.put("mail.smtp.port", "587");
        prop.put("mail.smtp.auth", "true");
        prop.put("mail.smtp.starttls.enable", "true"); // TLS

        Session session = Session.getInstance(prop, new javax.mail.Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(SENDER_EMAIL, SENDER_PASSWORD);
            }
        });

        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(SENDER_EMAIL));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(to));
        message.setSubject("MHRS - Doktor Paneli Giris Kodunuz");
        message.setText("Merhaba Doktor,\n\nSisteme giriş kodunuz: " + otpCode + "\n\nBu kodu kimseyle paylasmayiniz.");

        Transport.send(message);
    }
}
