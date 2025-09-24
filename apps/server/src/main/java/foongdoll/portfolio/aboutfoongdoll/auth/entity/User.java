package foongdoll.portfolio.aboutfoongdoll.auth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")  // 테이블명: users
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;   // PK

    @Column(nullable = false, unique = true, length = 50)
    private String username;   // 로그인 아이디

    @Column(nullable = false, length = 200)
    private String password;   // 암호화된 비밀번호 (BCrypt)

    @Column(nullable = false, length = 20)
    private String role;       // 권한 (예: "ADMIN")

    @Column(nullable = false)
    private boolean enabled = true;  // 계정 활성 여부
}
