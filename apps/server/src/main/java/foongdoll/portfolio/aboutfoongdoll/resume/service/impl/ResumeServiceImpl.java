package foongdoll.portfolio.aboutfoongdoll.resume.service.impl;

import foongdoll.portfolio.aboutfoongdoll.common.dto.SectionResponse;
import foongdoll.portfolio.aboutfoongdoll.resume.entity.Resume;
import foongdoll.portfolio.aboutfoongdoll.resume.repository.ResumeRepository;
import foongdoll.portfolio.aboutfoongdoll.resume.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Optional;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResumeServiceImpl implements ResumeService {

    private static final String HEADER_TEMPLATE = "<h2 class='text-2xl font-bold'>인적사항</h2>";
    private static final String CONTACT_TEMPLATE = "<p class='mt-2 text-neutral-600'>%s: %s</p>";

    private final ResumeRepository resumeRepository;

    @Override
    public Optional<SectionResponse> getResume() {
        return resumeRepository.findTopByOrderByIdAsc()
                .map(this::buildSection);
    }

    private SectionResponse buildSection(Resume resume) {
        String header = HEADER_TEMPLATE;
        String content = buildContent(resume);
        String footer = buildFooter(resume);

        return SectionResponse.builder()
                .header(header)
                .content(content)
                .footer(footer)
                .build();
    }

    private String buildContent(Resume resume) {
        StringBuilder builder = new StringBuilder();

        var personal = new ArrayList<String>();
        if (StringUtils.hasText(resume.getName())) {
            personal.add(resume.getName());
        }
        if (StringUtils.hasText(resume.getGender())) {
            personal.add(resume.getGender());
        }
        if (StringUtils.hasText(resume.getAddress())) {
            personal.add(resume.getAddress());
        }
        if (!personal.isEmpty()) {
            builder.append("<p class='mt-4'>")
                    .append(String.join(" / ", personal))
                    .append("</p>");
        }

        appendIfPresent(builder, "이메일", resume.getEmail());
        appendIfPresent(builder, "연락처", resume.getPhone());

        if (StringUtils.hasText(resume.getSummary())) {
            builder.append("<p class='mt-6 leading-relaxed'>")
                    .append(resume.getSummary())
                    .append("</p>");
        }

        appendListIfPresent(builder, "보유 기술", resume.getSkills());
        appendListIfPresent(builder, "주요 경험", resume.getExperiences());
        appendListIfPresent(builder, "활동", resume.getActivities());
        appendListIfPresent(builder, "교육", resume.getEducation());

        return builder.toString();
    }

    private String buildFooter(Resume resume) {
        if (!StringUtils.hasText(resume.getMemberCode())) {
            return "";
        }
        return String.format("<small class='block mt-6 text-neutral-500'>Member Code: %s</small>", resume.getMemberCode());
    }

    private void appendIfPresent(StringBuilder builder, String label, String value) {
        if (!StringUtils.hasText(value)) {
            return;
        }
        builder.append(String.format(CONTACT_TEMPLATE, label, value));
    }

    private void appendListIfPresent(StringBuilder builder, String label, String rawText) {
        if (!StringUtils.hasText(rawText)) {
            return;
        }
        builder.append("<div class='mt-6'>")
                .append(String.format("<h3 class='text-xl font-semibold'>%s</h3>", label))
                .append("<div class='mt-2 space-y-2'>");

        Stream.of(rawText.split("\\n"))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .forEach(item -> builder.append("<p class='text-neutral-700'>")
                        .append(item)
                        .append("</p>"));

        builder.append("</div></div>");
    }
}
