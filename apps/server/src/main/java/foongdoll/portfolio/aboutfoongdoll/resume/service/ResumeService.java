package foongdoll.portfolio.aboutfoongdoll.resume.service;

import foongdoll.portfolio.aboutfoongdoll.common.dto.SectionResponse;
import foongdoll.portfolio.aboutfoongdoll.resume.dto.ResumeRequest;

import java.util.Optional;

public interface ResumeService {

    Optional<SectionResponse> getResume();

    SectionResponse saveResume(ResumeRequest request);

    void deleteResume(String memberCode);
}
