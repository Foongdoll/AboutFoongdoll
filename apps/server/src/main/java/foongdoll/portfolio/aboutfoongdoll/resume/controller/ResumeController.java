package foongdoll.portfolio.aboutfoongdoll.resume.controller;

import foongdoll.portfolio.aboutfoongdoll.common.dto.SectionResponse;
import foongdoll.portfolio.aboutfoongdoll.resume.dto.ResumeRequest;
import foongdoll.portfolio.aboutfoongdoll.resume.service.ResumeService;
import foongdoll.portfolio.aboutfoongdoll.utils.ResponseVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @GetMapping
    public ResponseVO<SectionResponse> getResume() {
        return resumeService.getResume()
                .map(ResponseVO::ok)
                .orElseGet(() -> ResponseVO.fail("Resume not found"));
    }

    @PostMapping
    public ResponseVO<SectionResponse> saveResume(@RequestBody ResumeRequest request) {
        return ResponseVO.ok(resumeService.saveResume(request));
    }

    @DeleteMapping
    public ResponseVO<String> deleteResume(@RequestParam String memberCode) {
        resumeService.deleteResume(memberCode);
        return ResponseVO.ok("deleted");
    }
}
