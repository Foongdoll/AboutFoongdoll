package foongdoll.portfolio.aboutfoongdoll.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionResponse {

    private String header;
    private String content;
    private String footer;
}
