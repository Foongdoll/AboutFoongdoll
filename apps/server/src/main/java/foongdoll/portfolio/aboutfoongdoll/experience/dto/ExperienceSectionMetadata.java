package foongdoll.portfolio.aboutfoongdoll.experience.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExperienceSectionMetadata {

    private List<ExperienceRequest> experiences;
    private List<ExperienceDisplayItem> timeline;
}
