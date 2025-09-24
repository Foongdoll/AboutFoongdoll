package foongdoll.portfolio.aboutfoongdoll.resume.service;

import foongdoll.portfolio.aboutfoongdoll.common.dto.SectionResponse;

import java.util.Optional;

public interface ResumeService {

    Optional<SectionResponse> getResume();
}
