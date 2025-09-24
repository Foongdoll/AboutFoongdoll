package foongdoll.portfolio.aboutfoongdoll.resume.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "company")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    private Long id; // PK

    @Column(name = "company_code", nullable = false, unique = true)
    private String companyCode;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String address;

    @Column(length = 20)
    private String phone;

    @Column(length = 50)
    private String industry; // 업종

    @Column(length = 50)
    private String department; // 부서/팀

    @Column(length = 30)
    private String position;   // 직급

    @Column
    private Integer salary;    // 연봉
}

