package foongdoll.portfolio.aboutfoongdoll.resume.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resume")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resume_id")
    private Long id; // PK

    @Column(name = "member_code", nullable = false, unique = true)
    private String memberCode;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 10)
    private String gender;

    @Column(length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(length = 500)
    private String summary;   // 간단소개

    @Lob
    private String skills;    // 스킬 (JSON/Text)

    @Lob
    private String experiences; // 경험 (요약)

    @Lob
    private String activities;  // 활동

    @Lob
    private String education;   // 교육
}
