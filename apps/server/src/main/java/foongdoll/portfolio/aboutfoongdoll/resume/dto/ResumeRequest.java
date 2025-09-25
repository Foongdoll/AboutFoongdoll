package foongdoll.portfolio.aboutfoongdoll.resume.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ResumeRequest {

    private String memberCode;
    private String name;
    private String gender;
    private String email;
    private String phone;
    private String address;
    private String summary;
    private String skills;
    private String experiences;
    private String activities;
    private String education;
}
