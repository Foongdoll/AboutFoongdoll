package foongdoll.portfolio.aboutfoongdoll.post.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class PageResponse<T> {
    private List<T> items;
    private int totalPages;
    private long totalElements;
    private int page;   // 현재 페이지(1-base)
    private int size;   // 페이지 크기
}
