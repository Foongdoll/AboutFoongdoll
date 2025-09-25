package foongdoll.portfolio.aboutfoongdoll.resume.service.impl;

import foongdoll.portfolio.aboutfoongdoll.common.dto.SectionResponse;
import foongdoll.portfolio.aboutfoongdoll.resume.dto.ResumeRequest;
import foongdoll.portfolio.aboutfoongdoll.resume.dto.ResumeSectionMetadata;
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

    private static final String HEADER_TEMPLATE =
            "<div class='pt-2 pb-3 px-8'>"
                    + "  <h2 class='text-2xl font-bold tracking-tight'>이력서</h2>"
                    + "</div>";

    // 연락처 라인
    private static final String CONTACT_LINE =
            "<div class='flex items-center gap-2 text-[15px] text-neutral-800'>"
                    + "  <span class='shrink-0 text-neutral-500'>%s</span>"
                    + "  <span>%s</span>"
                    + "</div>";

    private final ResumeRepository resumeRepository;

    @Override
    public Optional<SectionResponse> getResume() {
        return resumeRepository.findTopByOrderByIdAsc()
                .map(this::buildSection);
    }

    @Override
    @Transactional
    public SectionResponse saveResume(ResumeRequest request) {
        if (!StringUtils.hasText(request.getMemberCode())) {
            throw new IllegalArgumentException("memberCode is required");
        }

        Resume resume = resumeRepository.findByMemberCode(request.getMemberCode())
                .orElseGet(() -> Resume.builder()
                        .memberCode(request.getMemberCode())
                        .build());

        resume.setName(request.getName());
        resume.setGender(request.getGender());
        resume.setEmail(request.getEmail());
        resume.setPhone(request.getPhone());
        resume.setAddress(request.getAddress());
        resume.setSummary(request.getSummary());
        resume.setSkills(request.getSkills());
        resume.setExperiences(request.getExperiences());
        resume.setActivities(request.getActivities());
        resume.setEducation(request.getEducation());

        Resume saved = resumeRepository.save(resume);
        return buildSection(saved);
    }

    @Override
    @Transactional
    public void deleteResume(String memberCode) {
        if (!StringUtils.hasText(memberCode)) {
            throw new IllegalArgumentException("memberCode is required");
        }

        resumeRepository.findByMemberCode(memberCode)
                .ifPresent(resumeRepository::delete);
    }

    private SectionResponse buildSection(Resume resume) {
        String header = HEADER_TEMPLATE;
        String content = buildContent(resume);
        String footer = buildFooter(resume);

        return SectionResponse.builder()
                .header(header)
                .content(content)
                .footer(footer)
                .metadata(ResumeSectionMetadata.builder()
                        .form(toForm(resume))
                        .build())
                .build();
    }

    private ResumeRequest toForm(Resume resume) {
        ResumeRequest form = new ResumeRequest();
        form.setMemberCode(resume.getMemberCode());
        form.setName(resume.getName());
        form.setGender(resume.getGender());
        form.setEmail(resume.getEmail());
        form.setPhone(resume.getPhone());
        form.setAddress(resume.getAddress());
        form.setSummary(resume.getSummary());
        form.setSkills(resume.getSkills());
        form.setExperiences(resume.getExperiences());
        form.setActivities(resume.getActivities());
        form.setEducation(resume.getEducation());
        return form;
    }

    // 본문 콘텐츠 생성
    private String buildContent(Resume r) {
        String name = safe(r.getName());
        String gender = safe(r.getGender());
        String address = safe(r.getAddress());

        StringBuilder html = new StringBuilder();
        html.append("<div class='px-8 pb-8'>");

        // 헤더
        html.append(
                "<section class='mb-8'>"
                        + "  <div class='flex flex-col gap-2'>"
                        + "    <h1 class='text-3xl font-bold tracking-tight'>" + name + "</h1>"
                        + "    <div class='flex flex-wrap gap-x-3 gap-y-1 text-[15px] text-neutral-700'>"
                        +          joinSlash(gender, address)
                        + "    </div>"
                        + "  </div>"
                        + "</section>"
        );

        // 경력: 파이프(|) 분리 전용 카드
        appendCareerList(html, "경력", r.getExperiences());

        // 활동/학력: 기존 카드
        appendCardList(html, "활동", r.getActivities());
        appendCardList(html, "학력", r.getEducation());

        html.append("</div>");
        return html.toString();
    }

    // 푸터(멤버 코드)
    private String buildFooter(Resume r) {
        if (!has(r.getMemberCode())) return "";
        return "<div class='px-8 pb-4 pt-3 border-t border-neutral-200/80 text-sm text-neutral-500'>"
                +   "- GitHub: <a target=\"blank\" href=\"https://github.com/Foongdoll\" style=\"text-decoration:none;cursor:pointer;\">[github.com/Foongdoll]</a>" +
                "<a href=\"https://www.gitanimals.org/en_US?utm_medium=image&utm_source=Foongdoll&utm_content=farm\">\n" +
                "<img\n" +
                "  src=\"https://render.gitanimals.org/farms/Foongdoll\"\n" +
                "  width=\"100%\"\n" +
                "  height=\"500\"\n" +
                "/>\n" +
                "</a>"
                + "</div>";
    }

    /* ───────────── 리스트: 카드 스타일 ───────────── */
    private void appendCardList(StringBuilder out, String title, String raw) {
        if (!has(raw)) return;

        String id = title.equals("경력") ? "career" : "education";

        StringBuilder body = new StringBuilder();
        body.append("<div class='space-y-3'>"); // 항목 간 간격

        for (String line : raw.split("\\n")) {
            String item = line.trim();
            if (!has(item)) continue;
            body.append(
                    "<div id=\""+id+"\" class='rounded-lg border border-neutral-200 px-4 py-3 shadow-[0_1px_6px_rgba(0,0,0,0.04)]'>"
                            + "  <p class='text-[15px] leading-relaxed text-neutral-900'>" + safe(item) + "</p>"
                            + "</div>"
            );
        }
        body.append("</div>");

        out.append(
                "<section class='mb-8'>"
                        + "  <h3 class='text-lg font-semibold tracking-tight mb-3 border-b border-neutral-200 pb-1'>" + safe(title) + "</h3>"
                        +       body
                        + "</section>"
        );
    }

    /* ───────────── 칩 목록 (쉼표/세미콜론/줄바꿈) ───────────── */
    private String chipList(String raw) {
        String[] tokens = raw.split("[,;\\n]");
        StringBuilder sb = new StringBuilder();
        String[] color = {
                "bg-blue-100 text-blue-800",
                "bg-emerald-100 text-emerald-800",
                "bg-rose-100 text-rose-800",
                "bg-amber-100 text-amber-900",
                "bg-violet-100 text-violet-800"
        };
        int idx = 0;

        for (String t : tokens) {
            String tag = t.trim();
            if (!has(tag)) continue;
            String c = color[idx++ % color.length];
            sb.append("<span class='inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border border-white/60 ")
                    .append(c)
                    .append("'>")
                    .append(safe(tag))
                    .append("</span>");
        }
        return sb.toString();
    }

    /* ───────────── 유틸 ───────────── */
    private boolean has(String s) { return s != null && !s.isBlank(); }
    private String safe(String s) {
        if (s == null) return "";
        return s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
                .replace("\"","&quot;").replace("'","&#39;");
    }
    private String joinSlash(String... xs) {
        return java.util.Arrays.stream(xs).filter(this::has).reduce((a,b)->a+" / "+b).orElse("");
    }

    /** experiences: "회사명 | 기간 | 부서/팀 | 직급" 줄바꿈 저장 */
    private void appendCareerList(StringBuilder out, String title, String raw) {
        if (!has(raw)) return;

        StringBuilder body = new StringBuilder();
        body.append("<div class='space-y-4'>"); // 항목 간 간격

        for (String line : raw.split("\\n")) {
            String item = line.trim();
            if (!has(item)) continue;

            // 파이프(|) 기준 분리
            String[] parts    = item.split("\\|");
            String company    = parts.length > 0 ? safe(parts[0].trim()) : "";
            String period     = parts.length > 1 ? safe(parts[1].trim()) : "";
            String dept       = parts.length > 2 ? safe(parts[2].trim()) : "";
            String position   = parts.length > 3 ? safe(parts[3].trim()) : "";
            boolean current   = period.contains("현재");

            // 카드
            body.append(
                    "<article class='rounded-2xl border border-neutral-200/70 bg-white/90 px-4 py-3 sm:px-5 sm:py-4 "
                            + "shadow-[0_1px_8px_rgba(0,0,0,0.04)]'>"

                            // 헤더: 회사명(좌) / 기간(우)
                            + "  <div class='grid grid-cols-[1fr_auto] items-baseline gap-3'>"
                            + "    <h4 class='text-[18px] sm:text-lg font-semibold tracking-tight text-neutral-900 break-words'>" + company + "</h4>"
                            + "    <span class='text-[12px] tracking-wide text-neutral-500'>" + period + "</span>"
                            + "  </div>"

                            // 서브: 부서/직급/재직중
                            + "  <div class='mt-2 flex flex-wrap items-center gap-2'>"
                            +        (has(dept)     ? badge(dept,     "ghost") : "")
                            +        (has(position) ? badge(position, "ghost") : "")
                            +        (current       ? liveBadge("재직중")       : "")
                            + "  </div>"

                            + "</article>"
            );
        }

        body.append("</div>");

        out.append(
                "<section class='mb-8'>"
                        + "  <h3 class='text-lg font-semibold tracking-tight mb-3 border-b border-neutral-200 pb-1'>"
                        +       safe(title)
                        + "  </h3>"
                        +       body
                        + "</section>"
        );
    }

    /** 고스트 칩 (부서/직급) */
    private String badge(String text, String tone) {
        // 색만 바꾸고 싶으면 cls만 손보면 됩니다.
        String cls = "border-neutral-300/70 bg-white/70 text-neutral-800";
        return "<span class='inline-flex items-center "
                + "rounded-full border px-3 py-1 text-[13px] font-medium "
                + "whitespace-nowrap leading-tight "   // ★ 한 줄 고정 + 라인하이트 타이트
                + cls + "'>"
                + safe(text)
                + "</span>";
    }

    /** 재직중 라벨: 초록 점 + 텍스트(역시 패딩 기반) */
    private String liveBadge(String text) {
        return  "<span class='inline-flex items-center gap-1.5 "
                + "rounded-full border border-emerald-200 bg-emerald-50 "
                + "px-3 py-1 text-[13px] font-medium text-emerald-700 "
                + "whitespace-nowrap leading-tight'>"
                + "  <span class='h-1.5 w-1.5 rounded-full bg-emerald-500'></span>"
                +    safe(text)
                + "</span>";
    }

}
