package foongdoll.portfolio.aboutfoongdoll.experience.service.impl;

import foongdoll.portfolio.aboutfoongdoll.common.dto.SectionResponse;
import foongdoll.portfolio.aboutfoongdoll.experience.dto.ExperienceRequest;
import foongdoll.portfolio.aboutfoongdoll.experience.dto.ExperienceSectionMetadata;
import foongdoll.portfolio.aboutfoongdoll.experience.entity.Experience;
import foongdoll.portfolio.aboutfoongdoll.experience.repository.ExperienceRepository;
import foongdoll.portfolio.aboutfoongdoll.experience.service.ExperienceService;
import foongdoll.portfolio.aboutfoongdoll.resume.entity.Company;
import foongdoll.portfolio.aboutfoongdoll.resume.repository.CompanyRepository;
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
    private final CompanyRepository companyRepository;

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

    @Override
    @Transactional
    public SectionResponse saveExperience(ExperienceRequest request) {
        if (!StringUtils.hasText(request.getExperienceCode())) {
            throw new IllegalArgumentException("experienceCode is required");
        }
        if (!StringUtils.hasText(request.getCompanyCode())) {
            throw new IllegalArgumentException("companyCode is required");
        }

        Company company = companyRepository.findByCompanyCode(request.getCompanyCode())
                .orElseGet(() -> Company.builder()
                        .companyCode(request.getCompanyCode())
                        .build());

        if (company.getId() == null && !StringUtils.hasText(request.getCompanyName())) {
            throw new IllegalArgumentException("companyName is required for new company");
        }

        if (StringUtils.hasText(request.getCompanyName())) {
            company.setName(request.getCompanyName());
        }
        if (request.getCompanyAddress() != null) {
            company.setAddress(request.getCompanyAddress());
        }
        if (request.getCompanyPhone() != null) {
            company.setPhone(request.getCompanyPhone());
        }
        if (request.getCompanyIndustry() != null) {
            company.setIndustry(request.getCompanyIndustry());
        }
        if (request.getCompanyDepartment() != null) {
            company.setDepartment(request.getCompanyDepartment());
        }
        if (request.getCompanyPosition() != null) {
            company.setPosition(request.getCompanyPosition());
        }
        if (request.getCompanySalary() != null) {
            company.setSalary(request.getCompanySalary());
        }

        Company savedCompany = companyRepository.save(company);

        Experience experience = experienceRepository.findByExperienceCode(request.getExperienceCode())
                .orElseGet(() -> Experience.builder()
                        .experienceCode(request.getExperienceCode())
                        .company(savedCompany)
                        .build());

        experience.setCompany(savedCompany);
        experience.setName(request.getName());
        experience.setPeriod(request.getPeriod());
        experience.setRole(request.getRole());
        experience.setTechStack(request.getTechStack());
        experience.setKeywords(request.getKeywords());
        experience.setDetails(request.getDetails());

        experienceRepository.save(experience);

        return getExperience(savedCompany.getCompanyCode())
                .orElseThrow(() -> new IllegalStateException("Failed to load experience after save"));
    }

    @Override
    @Transactional
    public void deleteExperience(String experienceCode) {
        if (!StringUtils.hasText(experienceCode)) {
            throw new IllegalArgumentException("experienceCode is required");
        }

        experienceRepository.findByExperienceCode(experienceCode)
                .ifPresent(experienceRepository::delete);
    }

    private SectionResponse buildSection(List<Experience> experiences) {
        String header = HEADER_TEMPLATE;
        String content = buildContent(experiences);
        String footer = buildFooter(experiences);

        return SectionResponse.builder()
                .header(header)
                .content(content)
                .footer(footer)
                .metadata(ExperienceSectionMetadata.builder()
                        .experiences(experiences.stream()
                                .map(this::toForm)
                                .collect(Collectors.toList()))
                        .build())
                .build();
    }

    private String buildContent(List<Experience> experiences) {
        StringBuilder b = new StringBuilder();
        b.append("<div class='space-y-8'>");

        for (Experience e : experiences) {
            b.append("<article class='relative sm:pl-8'>");

            // 타임라인 점 (sm 이상에서만)
            b.append("<span class='hidden sm:block absolute left-0 top-6 h-3 w-3 rounded-full bg-sky-400 ring-4 ring-sky-100 shadow'></span>");

            // 카드
            b.append("<div class='rounded-2xl border border-neutral-200 bg-white/90 p-5 sm:p-6 shadow-[0_1px_12px_rgba(0,0,0,0.05)]'>");

            // 헤더(제목/회사/기간/역할)
            if (has(e.getName())) {
                b.append(String.format("<h3 class='text-xl font-semibold tracking-tight text-neutral-900'>%s</h3>", safe(e.getName())));
            }
            if (e.getCompany()!=null && has(e.getCompany().getName())) {
                b.append(String.format("<p class='mt-1 text-[13px] text-neutral-500'>%s</p>", safe(e.getCompany().getName())));
            }
            if (has(e.getPeriod())) {
                b.append(String.format("<p class='mt-1 text-[12px] uppercase tracking-wide text-neutral-400'>%s</p>", safe(e.getPeriod())));
            }
            if (has(e.getRole())) {
                b.append(String.format(
                        "<div class='mt-3'><span class='inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700'>%s</span></div>",
                        safe(e.getRole())
                ));
            }

            // 섹션: 기술 스택(칩), 키워드(칩), 상세(불릿)
            appendChips(b, "기술 스택", e.getTechStack());
            appendChips(b, "키워드",   e.getKeywords());
            appendBullets(b, "상세",    e.getDetails());

            b.append("</div>");     // 카드 끝
            b.append("</article>");
        }

        b.append("</div>");
        return b.toString();
    }


    private ExperienceRequest toForm(Experience experience) {
        ExperienceRequest form = new ExperienceRequest();
        form.setExperienceCode(experience.getExperienceCode());
        form.setName(experience.getName());
        form.setPeriod(experience.getPeriod());
        form.setRole(experience.getRole());
        form.setTechStack(experience.getTechStack());
        form.setKeywords(experience.getKeywords());
        form.setDetails(experience.getDetails());

        if (experience.getCompany() != null) {
            form.setCompanyCode(experience.getCompany().getCompanyCode());
            form.setCompanyName(experience.getCompany().getName());
            form.setCompanyAddress(experience.getCompany().getAddress());
            form.setCompanyPhone(experience.getCompany().getPhone());
            form.setCompanyIndustry(experience.getCompany().getIndustry());
            form.setCompanyDepartment(experience.getCompany().getDepartment());
            form.setCompanyPosition(experience.getCompany().getPosition());
            form.setCompanySalary(experience.getCompany().getSalary());
        }

        return form;
    }

    private String buildFooter(List<Experience> experiences) {
//        List<String> companyNames = experiences.stream()
//                .map(Experience::getCompany)
//                .filter(company -> company != null && StringUtils.hasText(company.getName()))
//                .map(company -> company.getName())
//                .distinct()
//                .collect(Collectors.toList());
//
//        if (companyNames.isEmpty()) {
//            return String.format("<small class='block mt-6 text-neutral-500'>총 %d건의 경험</small>", experiences.size());
//        }
//
//        String joined = String.join(", ", companyNames);
//        return String.format("<small class='block mt-6 text-neutral-500'>%s 등 총 %d건의 경험</small>", joined, experiences.size());
        return "";
    }

    private void appendChips(StringBuilder b, String label, String raw) {
        if (!has(raw)) return;

        b.append(String.format("<h4 class='mt-6 mb-2 text-sm font-semibold text-neutral-700'>%s</h4>", safe(label)));
        b.append("<div class='flex flex-wrap gap-2'>");

        for (String t : raw.split("[,;\\n]")) {
            String tag = t.trim();
            if (!has(tag)) continue;
            b.append("<span class='inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-700'>")
                    .append(safe(tag))
                    .append("</span>");
        }
        b.append("</div>");
    }

    private void appendBullets(StringBuilder b, String label, String raw) {
        if (!has(raw)) return;

        b.append(String.format("<h4 class='mt-6 mb-2 text-sm font-semibold text-neutral-700'>%s</h4>", safe(label)));
        b.append("<ul class='mt-1 space-y-2'>");

        for (String line : raw.split("\\n")) {
            String item = line.trim();
            if (!has(item)) continue;
            b.append("<li class='relative pl-5 text-[15px] leading-relaxed text-neutral-800 break-words'>")
                    .append("<span class='absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-sky-400'></span>")
                    .append(safe(item))
                    .append("</li>");
        }
        b.append("</ul>");
    }

    private boolean has(String s) { return s != null && !s.isBlank(); }

    private String safe(String s) {
        if (s == null) return "";
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
                .replace("\"","&quot;").replace("'","&#39;");
    }
}
