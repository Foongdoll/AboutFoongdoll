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
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * UI 개선 버전
 * - 칩(기술 스택/키워드): 테두리 삭제, 배경/그라데이션/그림자/내부 패딩 강화
 * - 상세: 카드 패딩 확대, 제목/본문 구분선 및 타이포 대비 강화, 여백 증가
 * - 선택 가능 레이아웃: CARD(기본)/DL/TIMELINE
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExperienceServiceImpl implements ExperienceService {

    // ====== Config ======
    private static final String HEADER_TEMPLATE = "<h2 class='text-2xl font-bold'>경험</h2>";

    /** 상세 렌더링 모드 */
    private static final DetailRenderMode DETAIL_MODE = DetailRenderMode.CARD;
    private enum DetailRenderMode { CARD, DL, TIMELINE }

    // 구분자: " - " / " — " / " : " (최초 1회 분리)
    private static final Pattern SPLIT_DELIM =
            Pattern.compile("\\s*(?:\\s-\\s|\\s—\\s|\\s:\\s)\\s*");

    // 기간 뱃지: (2023.07– ) 형태
    private static final Pattern PERIOD_BADGE =
            Pattern.compile("\\((?:19|20)\\d{2}\\.\\d{2}[^)]*\\)");

    // 숫자/퍼센트 강조: 1,234 / 12.3% 등
    private static final Pattern NUMBER_TINT =
            Pattern.compile("(?<![\\w@])(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?%?");

    // ====== UI tokens (Tailwind 클래스 모음) ======
    private static final String CARD_BASE = "rounded-2xl border border-neutral-200/70 bg-white/95 p-5 sm:p-6 shadow-[0_1px_12px_rgba(0,0,0,0.06)]";
    private static final String CHIP = "inline-flex items-center rounded-full bg-neutral-100/90 px-3 py-1 text-[13px] leading-none text-neutral-800 shadow-sm ring-1 ring-inset ring-neutral-200/60 hover:bg-neutral-100 transition";
    private static final String CHIP_WRAPPER = "flex flex-wrap gap-2";
    private static final String SECTION_LABEL = "mt-6 mb-2 text-sm font-semibold text-neutral-800";
    private static final String SMALL_META = "mt-1 text-[12px] uppercase tracking-wide text-neutral-400";
    private static final String SUB_META = "mt-1 text-[13px] text-neutral-500";

    private final ExperienceRepository experienceRepository;
    private final CompanyRepository companyRepository;

    @Override
    public Optional<SectionResponse> getExperience(String companyCode) {
        List<Experience> experiences = StringUtils.hasText(companyCode)
                ? experienceRepository.findByCompanyCompanyCodeOrderByIdAsc(companyCode)
                : experienceRepository.findAllByOrderByIdAsc();
        if (experiences.isEmpty()) return Optional.empty();
        return Optional.of(buildSection(experiences));
    }

    @Override
    @Transactional
    public SectionResponse saveExperience(ExperienceRequest request) {
        if (!StringUtils.hasText(request.getExperienceCode())) throw new IllegalArgumentException("experienceCode is required");
        if (!StringUtils.hasText(request.getCompanyCode())) throw new IllegalArgumentException("companyCode is required");

        Company company = companyRepository.findByCompanyCode(request.getCompanyCode())
                .orElseGet(() -> Company.builder().companyCode(request.getCompanyCode()).build());

        if (company.getId() == null && !StringUtils.hasText(request.getCompanyName()))
            throw new IllegalArgumentException("companyName is required for new company");

        if (StringUtils.hasText(request.getCompanyName())) company.setName(request.getCompanyName());
        if (request.getCompanyAddress() != null) company.setAddress(request.getCompanyAddress());
        if (request.getCompanyPhone() != null) company.setPhone(request.getCompanyPhone());
        if (request.getCompanyIndustry() != null) company.setIndustry(request.getCompanyIndustry());
        if (request.getCompanyDepartment() != null) company.setDepartment(request.getCompanyDepartment());
        if (request.getCompanyPosition() != null) company.setPosition(request.getCompanyPosition());
        if (request.getCompanySalary() != null) company.setSalary(request.getCompanySalary());

        Company savedCompany = companyRepository.save(company);

        Experience experience = experienceRepository.findByExperienceCode(request.getExperienceCode())
                .orElseGet(() -> Experience.builder().experienceCode(request.getExperienceCode()).company(savedCompany).build());

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
        if (!StringUtils.hasText(experienceCode)) throw new IllegalArgumentException("experienceCode is required");
        experienceRepository.findByExperienceCode(experienceCode).ifPresent(experienceRepository::delete);
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
                        .experiences(experiences.stream().map(this::toForm).collect(Collectors.toList()))
                        .build())
                .build();
    }

    private String buildContent(List<Experience> experiences) {
        StringBuilder b = new StringBuilder();
        b.append("<div class='space-y-8'>");
        for (Experience e : experiences) {
            b.append("<article class='relative sm:pl-8'>");
            // 타임라인 점 (sm 이상)
            b.append("<span class='hidden sm:block absolute left-0 top-6 h-3 w-3 rounded-full bg-sky-400 ring-4 ring-sky-100 shadow'></span>");
            // 카드
            b.append("<div class='" + CARD_BASE + "'>");

            // 헤더
            if (has(e.getName())) b.append(String.format("<h3 class='text-xl font-semibold tracking-tight text-neutral-900'>%s</h3>", safe(e.getName())));
            if (e.getCompany()!=null && has(e.getCompany().getName())) b.append(String.format("<p class='"+SUB_META+"'>%s</p>", safe(e.getCompany().getName())));
            if (has(e.getPeriod())) b.append(String.format("<p class='"+SMALL_META+"'>%s</p>", safe(e.getPeriod())));
            if (has(e.getRole())) b.append(String.format("<div class='mt-3'><span class='inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 text-xs font-medium'>%s</span></div>", safe(e.getRole())));

            // 칩 섹션 (테두리 제거, 패딩/그림자 추가)
            appendChips(b, "기술 스택", e.getTechStack());
            appendChips(b, "키워드", e.getKeywords());

            // 상세
            switch (DETAIL_MODE) {
                case DL:        appendDefinitionList(b, "상세", e.getDetails()); break;
                case TIMELINE:  appendMiniTimeline(b, "상세", e.getDetails()); break;
                case CARD:
                default:        appendDetailBlocks(b, "상세", e.getDetails()); break;
            }

            b.append("</div>"); // 카드 끝
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

    private String buildFooter(List<Experience> experiences) { return ""; }

    // ===================== Detail: CARD Blocks =====================
    private void appendDetailBlocks(StringBuilder b, String label, String raw) {
        if (!has(raw)) return;
        b.append(String.format("<h4 class='"+SECTION_LABEL+"'>%s</h4>", safe(label)));
        // 2열 그리드 + 카드 패딩 확장 + 내부 여백 강화
        b.append("<div class='grid grid-cols-1 sm:grid-cols-2 gap-4'>");
        for (String line : raw.split("\n")) {
            String item = line.trim();
            if (!has(item)) continue;
            b.append(renderDetailBlock(item));
        }
        b.append("</div>");
    }

    private String renderDetailBlock(String raw) {
        String withBadges = PERIOD_BADGE.matcher(raw).replaceAll(m ->
                "<span class='ml-2 align-[2px] rounded-full bg-neutral-100 px-2 py-0.5 text-[12px] text-neutral-600 border border-neutral-200'>" + safe(m.group()) + "</span>"
        );
        withBadges = NUMBER_TINT.matcher(withBadges).replaceAll(m ->
                "<span class='font-semibold text-sky-700'>" + safe(m.group()) + "</span>"
        );

        String[] parts = SPLIT_DELIM.split(withBadges, 2);
        String head = parts.length == 2 ? parts[0].trim() : "";
        String body = parts.length == 2 ? parts[1].trim() : withBadges;

        StringBuilder card = new StringBuilder();
        card.append("<div class='rounded-xl ring-1 ring-neutral-200/70 bg-white/90 p-4 sm:p-5 shadow-[0_1px_6px_rgba(0,0,0,0.05)]'>");
        if (has(head)) {
            card.append("<div class='text-[14px] font-semibold text-neutral-900 tracking-tight'>")
                    .append(safe(head))
                    .append("</div>")
                    .append("<div class='mt-2 h-px bg-neutral-200/80'></div>"); // 제목/본문 시각 구분선
        }
        card.append("<div class='mt-2 text-[14px] leading-7 text-neutral-800 hyphens-auto'>")
                .append(parts.length == 2 ? body : withBadges)
                .append("</div>")
                .append("</div>");
        return card.toString();
    }

    // ===================== Detail: Definition List =====================
    private void appendDefinitionList(StringBuilder b, String label, String raw) {
        if (!has(raw)) return;
        b.append(String.format("<h4 class='"+SECTION_LABEL+"'>%s</h4>", safe(label)));
        b.append("<div class='rounded-2xl ring-1 ring-neutral-200/70 bg-white/95 p-2'>");
        b.append("<dl class='divide-y divide-neutral-200/80'>");
        for (String line : raw.split("\n")) {
            String item = line.trim();
            if (!has(item)) continue;

            String withBadges = PERIOD_BADGE.matcher(item).replaceAll(m ->
                    "<span class='ml-2 align-[2px] rounded-full bg-neutral-100 px-2 py-0.5 text-[12px] text-neutral-600 border border-neutral-200'>" + safe(m.group()) + "</span>"
            );
            withBadges = NUMBER_TINT.matcher(withBadges).replaceAll(m ->
                    "<span class='font-semibold text-sky-700'>" + safe(m.group()) + "</span>"
            );

            String[] parts = SPLIT_DELIM.split(withBadges, 2);
            String term = parts.length == 2 ? safe(parts[0].trim()) : "";
            String desc = parts.length == 2 ? parts[1].trim() : withBadges;

            b.append("<div class='grid grid-cols-3 gap-3 py-3 px-3'>")
                    .append("<dt class='col-span-1 text-[13px] font-semibold text-neutral-900 bg-neutral-50 rounded-md px-2 py-1'>")
                    .append(term).append("</dt>")
                    .append("<dd class='col-span-2 text-[14px] leading-7 text-neutral-800'>").append(desc).append("</dd>")
                    .append("</div>");
        }
        b.append("</dl></div>");
    }

    // ===================== Detail: Mini Timeline =====================
    private void appendMiniTimeline(StringBuilder b, String label, String raw) {
        if (!has(raw)) return;
        b.append(String.format("<h4 class='"+SECTION_LABEL+"'>%s</h4>", safe(label)));
        b.append("<div class='space-y-3'>");
        for (String line : raw.split("\n")) {
            String item = line.trim();
            if (!has(item)) continue;

            String period = "";
            Matcher m = PERIOD_BADGE.matcher(item);
            if (m.find()) { period = m.group(); item = item.replace(period, "").trim(); }

            String tinted = NUMBER_TINT.matcher(item).replaceAll(mm ->
                    "<span class='font-semibold text-sky-700'>" + safe(mm.group()) + "</span>"
            );

            String[] parts = SPLIT_DELIM.split(tinted, 2);
            String head = parts.length == 2 ? safe(parts[0].trim()) : "";
            String body = parts.length == 2 ? parts[1].trim() : tinted;

            b.append("<div class='relative pl-28'>")
                    .append("<div class='absolute left-0 top-1 w-24 text-right'>");
            if (has(period)) {
                b.append("<span class='inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[12px] text-neutral-600 border border-neutral-200'>")
                        .append(safe(period)).append("</span>");
            }
            b.append("</div>")
                    .append("<div class='rounded-xl ring-1 ring-neutral-200/70 bg-white/90 p-4 shadow-[0_1px_6px_rgba(0,0,0,0.05)]'>");
            if (has(head)) b.append("<div class='text-[14px] font-semibold text-neutral-900'>").append(head).append("</div>");
            b.append("<p class='mt-2 text-[14px] leading-7 text-neutral-800'>").append(body).append("</p>")
                    .append("</div></div>");
        }
        b.append("</div>");
    }

    // ===================== Chips (테두리 제거 + 패딩/그림자) =====================
    private void appendChips(StringBuilder b, String label, String raw) {
        if (!has(raw)) return;
        b.append(String.format("<h4 class='"+SECTION_LABEL+"'>%s</h4>", safe(label)));
        b.append("<div class='"+CHIP_WRAPPER+"'>");
        for (String t : raw.split("[,;\n]")) {
            String tag = t.trim();
            if (!has(tag)) continue;
            b.append("<span class='"+CHIP+"'>")
                    .append(safe(tag))
                    .append("</span>");
        }
        b.append("</div>");
    }

    // ===================== Utilities =====================
    private boolean has(String s) { return s != null && !s.isBlank(); }
    private String safe(String s) {
        if (s == null) return "";
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
                .replace("\"","&quot;").replace("'","&#39;");
    }
}
