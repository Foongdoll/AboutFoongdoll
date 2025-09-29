package foongdoll.portfolio.aboutfoongdoll.post.service;

import foongdoll.portfolio.aboutfoongdoll.post.dto.PageResponse;
import foongdoll.portfolio.aboutfoongdoll.post.dto.PostRequest;
import foongdoll.portfolio.aboutfoongdoll.post.dto.PostResponse;

import java.util.List;
import java.util.Optional;

public interface PostService {

    PageResponse<PostResponse> getPosts(String category, int page, int size);

    Optional<PostResponse> getPost(Long postId);

    PostResponse createPost(PostRequest request);

    PostResponse updatePost(Long postId, PostRequest request);

    void deletePost(Long postId);
}
