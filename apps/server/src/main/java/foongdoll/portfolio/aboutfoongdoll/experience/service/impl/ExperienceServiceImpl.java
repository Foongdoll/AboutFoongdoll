package foongdoll.portfolio.aboutfoongdoll.experience.service.impl;

import foongdoll.portfolio.aboutfoongdoll.common.dto.SectionResponse;
import foongdoll.portfolio.aboutfoongdoll.experience.dto.ExperienceDisplayItem;
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

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExperienceServiceImpl implements ExperienceService {

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
        List<ExperienceRequest> forms = experiences.stream()
                .map(this::toForm)
                .collect(Collectors.toList());
        List<ExperienceDisplayItem> timeline = experiences.stream()
                .map(this::toDisplay)
                .collect(Collectors.toList());

        return SectionResponse.builder()
                .metadata(ExperienceSectionMetadata.builder()
                        .experiences(forms)
                        .timeline(timeline)
                        .build())
                .build();
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

    private ExperienceDisplayItem toDisplay(Experience experience) {
        ExperienceDisplayItem.ExperienceDisplayItemBuilder builder = ExperienceDisplayItem.builder()
                .experienceCode(experience.getExperienceCode())
                .title(experience.getName())
                .period(experience.getPeriod())
                .role(experience.getRole())
                .techStacks(splitTags(experience.getTechStack()))
                .keywords(splitTags(experience.getKeywords()))
                .details(splitDetails(experience.getDetails()));

        if (experience.getCompany() != null) {
            builder.companyName(experience.getCompany().getName());
            builder.companyDepartment(experience.getCompany().getDepartment());
            builder.companyPosition(experience.getCompany().getPosition());
            builder.companyIndustry(experience.getCompany().getIndustry());
        }

        return builder.build();
    }

    private List<String> splitTags(String raw) {
        if (!has(raw)) {
            return Collections.emptyList();
        }

        return Arrays.stream(raw.split("[,;\\n]"))
                .map(String::trim)
                .filter(this::has)
                .collect(Collectors.toList());
    }

    private List<String> splitDetails(String raw) {
        if (!has(raw)) {
            return Collections.emptyList();
        }

        return Arrays.stream(raw.split("\\R"))
                .map(this::normalizeBullet)
                .filter(this::has)
                .collect(Collectors.toList());
    }

    private String normalizeBullet(String line) {
        if (line == null) {
            return "";
        }
        String trimmed = line.trim();
        if (!has(trimmed)) {
            return "";
        }

        String cleaned = trimmed.replaceFirst("^[\\-•*\\u2022\\u2023\\u25E6\\u2219\\u2043\\u00B7\\u25AA\\u25C6\\s]+", "");
        return cleaned.trim();
    }

    private boolean has(String value) {
        return value != null && !value.isBlank();
    }
}
