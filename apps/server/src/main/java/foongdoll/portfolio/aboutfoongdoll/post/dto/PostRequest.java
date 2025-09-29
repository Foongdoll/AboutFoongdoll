package foongdoll.portfolio.aboutfoongdoll.post.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostRequest {

    private String title;
    private String category;
    private String keywords;
    private String summary;
    private String content;
}
