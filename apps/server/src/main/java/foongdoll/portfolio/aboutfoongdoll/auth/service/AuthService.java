package foongdoll.portfolio.aboutfoongdoll.auth.service;

import foongdoll.portfolio.aboutfoongdoll.utils.RequestVO;
import jakarta.servlet.http.HttpSession;

public interface AuthService {
    Object login(RequestVO vo, HttpSession session);

    void join(String username, String password);
}
