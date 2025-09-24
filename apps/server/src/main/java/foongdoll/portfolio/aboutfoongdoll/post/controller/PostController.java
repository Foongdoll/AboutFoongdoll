package foongdoll.portfolio.aboutfoongdoll.post.controller;

import foongdoll.portfolio.aboutfoongdoll.post.service.PostService;
import foongdoll.portfolio.aboutfoongdoll.utils.ResponseVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseVO<?> getPosts(@RequestParam(value = "category", required = false) String category) {
        return ResponseVO.ok(postService.getPosts(category));
    }
}
