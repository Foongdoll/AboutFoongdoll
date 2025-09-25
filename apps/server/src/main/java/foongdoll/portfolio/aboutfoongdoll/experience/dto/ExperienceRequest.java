package foongdoll.portfolio.aboutfoongdoll.experience.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ExperienceRequest {

    private String experienceCode;
    private String name;
    private String companyCode;
    private String companyName;
    private String companyAddress;
    private String companyPhone;
    private String companyIndustry;
    private String companyDepartment;
    private String companyPosition;
    private Integer companySalary;
    private String period;
    private String role;
    private String techStack;
    private String keywords;
    private String details;
}
