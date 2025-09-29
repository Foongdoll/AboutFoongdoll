package foongdoll.portfolio.aboutfoongdoll.post.dto;

import foongdoll.portfolio.aboutfoongdoll.post.entity.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PostResponse {

    private final Long id;
    private final String title;
    private final String category;
    private final String keywords;
    private final String summary;
    private final String content;
    private final LocalDateTime publishedAt;
    private final LocalDateTime updatedAt;

    public static PostResponse from(Post p) {
        return PostResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .summary(p.getSummary())
                .category(p.getCategory())
                .keywords(p.getKeywords())
                .content(p.getContent())
                .publishedAt(p.getPublishedAt() == null ? null : LocalDateTime.parse(p.getPublishedAt().toString()))
                .updatedAt(p.getUpdatedAt() == null ? null : LocalDateTime.parse(p.getUpdatedAt().toString()))
                .build();
    }
}
