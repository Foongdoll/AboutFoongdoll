package foongdoll.portfolio.aboutfoongdoll.experience.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExperienceDisplayItem {

    private String experienceCode;
    private String title;
    private String companyName;
    private String companyDepartment;
    private String companyPosition;
    private String companyIndustry;
    private String period;
    private String role;
    private List<String> techStacks;
    private List<String> keywords;
    private List<String> details;
}
