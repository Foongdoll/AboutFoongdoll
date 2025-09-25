package foongdoll.portfolio.aboutfoongdoll.experience.service;

import foongdoll.portfolio.aboutfoongdoll.common.dto.SectionResponse;
import foongdoll.portfolio.aboutfoongdoll.experience.dto.ExperienceRequest;

import java.util.Optional;

public interface ExperienceService {

    Optional<SectionResponse> getExperience(String companyCode);

    SectionResponse saveExperience(ExperienceRequest request);

    void deleteExperience(String experienceCode);
}
