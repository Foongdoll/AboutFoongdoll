package foongdoll.portfolio.aboutfoongdoll.experience.service;

import foongdoll.portfolio.aboutfoongdoll.common.dto.SectionResponse;

import java.util.Optional;

public interface ExperienceService {

    Optional<SectionResponse> getExperience(String companyCode);
}
