package foongdoll.portfolio.aboutfoongdoll.experience.service.impl;

import foongdoll.portfolio.aboutfoongdoll.common.dto.SectionResponse;
import foongdoll.portfolio.aboutfoongdoll.experience.entity.Experience;
import foongdoll.portfolio.aboutfoongdoll.experience.repository.ExperienceRepository;
import foongdoll.portfolio.aboutfoongdoll.experience.service.ExperienceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExperienceServiceImpl implements ExperienceService {

    private static final String HEADER_TEMPLATE = "<h2 class='text-2xl font-bold'>경험</h2>";

    private final ExperienceRepository experienceRepository;

    @Override
    public Optional<SectionResponse> getExperience(String companyCode) {
        List<Experience> experiences = StringUtils.hasText(companyCode)
                ? experienceRepository.findByCompanyCompanyCodeOrderByIdAsc(companyCode)
                : experienceRepository.findAllByOrderByIdAsc();

        if (experiences.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(buildSection(experiences));
    }

    private SectionResponse buildSection(List<Experience> experiences) {
        String header = HEADER_TEMPLATE;
        String content = buildContent(experiences);
        String footer = buildFooter(experiences);

        return SectionResponse.builder()
                .header(header)
                .content(content)
                .footer(footer)
                .build();
    }

    private String buildContent(List<Experience> experiences) {
        StringBuilder builder = new StringBuilder();
        builder.append("<div class='space-y-6'>");

        for (Experience experience : experiences) {
            builder.append("<article class='border-l-2 border-neutral-200 pl-6'>");

            if (StringUtils.hasText(experience.getName())) {
                builder.append(String.format("<h3 class='text-xl font-semibold text-neutral-800'>%s</h3>", experience.getName()));
            }

            if (experience.getCompany() != null && StringUtils.hasText(experience.getCompany().getName())) {
                builder.append(String.format("<p class='mt-1 text-neutral-500'>%s</p>", experience.getCompany().getName()));
            }

            if (StringUtils.hasText(experience.getPeriod())) {
                builder.append(String.format("<p class='mt-1 text-sm text-neutral-400'>%s</p>", experience.getPeriod()));
            }

            if (StringUtils.hasText(experience.getRole())) {
                builder.append(String.format("<p class='mt-3 font-medium text-neutral-700'>%s</p>", experience.getRole()));
            }

            appendList(builder, "기술 스택", experience.getTechStack());
            appendList(builder, "키워드", experience.getKeywords());
            appendList(builder, "상세", experience.getDetails());

            builder.append("</article>");
        }

        builder.append("</div>");
        return builder.toString();
    }

    private String buildFooter(List<Experience> experiences) {
        List<String> companyNames = experiences.stream()
                .map(Experience::getCompany)
                .filter(company -> company != null && StringUtils.hasText(company.getName()))
                .map(company -> company.getName())
                .distinct()
                .collect(Collectors.toList());

        if (companyNames.isEmpty()) {
            return String.format("<small class='block mt-6 text-neutral-500'>총 %d건의 경험</small>", experiences.size());
        }

        String joined = String.join(", ", companyNames);
        return String.format("<small class='block mt-6 text-neutral-500'>%s 등 총 %d건의 경험</small>", joined, experiences.size());
    }

    private void appendList(StringBuilder builder, String label, String rawText) {
        if (!StringUtils.hasText(rawText)) {
            return;
        }

        builder.append("<div class='mt-4'>")
                .append(String.format("<h4 class='text-sm font-semibold text-neutral-600 uppercase tracking-wide'>%s</h4>", label))
                .append("<ul class='mt-2 space-y-1 text-neutral-700'>");

        for (String line : rawText.split("\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            builder.append(String.format("<li class='leading-relaxed'>%s</li>", trimmed));
        }

        builder.append("</ul></div>");
    }
}
