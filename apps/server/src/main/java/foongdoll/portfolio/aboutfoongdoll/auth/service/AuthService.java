package foongdoll.portfolio.aboutfoongdoll.auth.service;

import foongdoll.portfolio.aboutfoongdoll.utils.RequestVO;

public interface AuthService {
    Object login(RequestVO vo);

    void join(String username, String password);
}
