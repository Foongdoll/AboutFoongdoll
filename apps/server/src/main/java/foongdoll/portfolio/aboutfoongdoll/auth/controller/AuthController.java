package foongdoll.portfolio.aboutfoongdoll.auth.controller;

import foongdoll.portfolio.aboutfoongdoll.auth.service.AuthService;
import foongdoll.portfolio.aboutfoongdoll.utils.RequestVO;
import foongdoll.portfolio.aboutfoongdoll.utils.ResponseVO;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseVO login(@RequestBody RequestVO vo, HttpSession session){
        return ResponseVO.ok(authService.login(vo, session));
    }

    @GetMapping("/admin/join")
    public ResponseVO join(@RequestParam String username, @RequestParam String password){
        authService.join(username, password);
        return ResponseVO.ok("기본 관리자 회원가입 완료");}
}
