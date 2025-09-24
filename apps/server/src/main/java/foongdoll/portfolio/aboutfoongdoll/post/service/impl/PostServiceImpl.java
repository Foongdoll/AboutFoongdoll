package foongdoll.portfolio.aboutfoongdoll.post.service.impl;

import foongdoll.portfolio.aboutfoongdoll.post.service.PostService;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class PostServiceImpl implements PostService {

    @Override
    public List<Object> getPosts(String category) {
        // 데이터 스키마 확정 후 구현 예정 - 현재는 빈 목록 반환
        return Collections.emptyList();
    }
}
