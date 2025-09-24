package foongdoll.portfolio.aboutfoongdoll.experience.entity;

import foongdoll.portfolio.aboutfoongdoll.resume.entity.Company;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "experience")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Experience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "experience_id")
    private Long id; // PK

    @Column(name = "experience_code", nullable = false, unique = true)
    private String experienceCode;

    @Column(nullable = false, length = 100)
    private String name; // 경력 이름

    // 소속 회사 (FK)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(length = 100)
    private String period; // 기간

    @Column(length = 255)
    private String role;   // 역할/맡은 업무

    @Lob
    private String techStack; // 사용 기술

    @Lob
    private String keywords;  // 키워드

    @Lob
    private String details;   // 상세 내용
}
