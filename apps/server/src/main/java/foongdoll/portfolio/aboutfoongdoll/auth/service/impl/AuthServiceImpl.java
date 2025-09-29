package foongdoll.portfolio.aboutfoongdoll.auth.service.impl;


import foongdoll.portfolio.aboutfoongdoll.auth.entity.User;
import foongdoll.portfolio.aboutfoongdoll.auth.repository.AuthRepository;
import foongdoll.portfolio.aboutfoongdoll.auth.service.AuthService;
import foongdoll.portfolio.aboutfoongdoll.utils.RequestVO;
import foongdoll.portfolio.aboutfoongdoll.utils.ResponseVO;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final PasswordEncoder pe;
    private final AuthRepository authRepository;

    @Override
    public Object login(RequestVO vo, HttpSession session) {
        String id = vo.get("username").toString();
        String pwd = vo.get("password").toString();

        // 1. 사용자 조회
        Optional<User> user = authRepository.findByUsername(id);
        if(!user.isPresent()){
            // 2. 비밀번호 암호화
            String encodedPwd = pe.encode("1234");

            // 3. 엔티티 생성 및 저장
            User u = User.builder()
                    .username("healim5028")
                    .password(encodedPwd)
                    .role("ADMIN")     // 포폴 사이트라 관리자 권한 고정
                    .enabled(true)
                    .build();

            return authRepository.save(u);
        }

        // 2. 비밀번호 검증
        if (!pe.matches(pwd, user.get().getPassword())) {
            return ResponseVO.fail("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String uuid = UUID.randomUUID().toString();
        session.setAttribute("token", uuid);
        return uuid;
    }

    @Override
    public void join(String username, String password) {
        // 1. 중복 확인
        if (authRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 사용자입니다.");
        }


    }
}
