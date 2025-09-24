package foongdoll.portfolio.aboutfoongdoll.experience.controller;

import foongdoll.portfolio.aboutfoongdoll.common.dto.SectionResponse;
import foongdoll.portfolio.aboutfoongdoll.experience.service.ExperienceService;
import foongdoll.portfolio.aboutfoongdoll.utils.ResponseVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/experience")
@RequiredArgsConstructor
public class ExperienceController {

    private final ExperienceService experienceService;

    @GetMapping
    public ResponseVO<SectionResponse> getExperience(@RequestParam(value = "company", required = false) String companyCode) {
        return experienceService.getExperience(companyCode)
                .map(ResponseVO::ok)
                .orElseGet(() -> ResponseVO.fail("Experience not found"));
    }
}
