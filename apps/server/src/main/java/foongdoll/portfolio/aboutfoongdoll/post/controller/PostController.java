package foongdoll.portfolio.aboutfoongdoll.post.controller;

import foongdoll.portfolio.aboutfoongdoll.post.dto.PageResponse;
import foongdoll.portfolio.aboutfoongdoll.post.dto.PostRequest;
import foongdoll.portfolio.aboutfoongdoll.post.dto.PostResponse;
import foongdoll.portfolio.aboutfoongdoll.post.service.PostService;
import foongdoll.portfolio.aboutfoongdoll.utils.ResponseVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ResponseVO<PageResponse<PostResponse>> getPosts(@RequestParam(value = "category", required = false) String category,
                                                           @RequestParam(defaultValue = "1") int page,
                                                           @RequestParam(defaultValue = "10") int size) {
        return ResponseVO.ok(postService.getPosts(category, page, size));
    }

    @GetMapping("/{postId}")
    public ResponseVO<PostResponse> getPost(@PathVariable Long postId) {
        return postService.getPost(postId)
                .map(ResponseVO::ok)
                .orElseGet(() -> ResponseVO.fail("Post not found"));
    }

    @PostMapping
    public ResponseVO<PostResponse> createPost(@RequestBody PostRequest request) {
        try {
            return ResponseVO.ok(postService.createPost(request));
        } catch (IllegalArgumentException e) {
            return ResponseVO.fail(e.getMessage());
        }
    }

    @PutMapping("/{postId}")
    public ResponseVO<PostResponse> updatePost(@PathVariable Long postId, @RequestBody PostRequest request) {
        try {
            return ResponseVO.ok(postService.updatePost(postId, request));
        } catch (IllegalArgumentException e) {
            return ResponseVO.fail(e.getMessage());
        }
    }

    @DeleteMapping("/{postId}")
    public ResponseVO<String> deletePost(@PathVariable Long postId) {
        try {
            postService.deletePost(postId);
            return ResponseVO.ok("deleted");
        } catch (IllegalArgumentException e) {
            return ResponseVO.fail(e.getMessage());
        }
    }
}
