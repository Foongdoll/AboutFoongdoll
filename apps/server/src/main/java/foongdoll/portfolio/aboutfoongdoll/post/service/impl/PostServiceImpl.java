package foongdoll.portfolio.aboutfoongdoll.post.service.impl;

import foongdoll.portfolio.aboutfoongdoll.post.dto.PageResponse;
import foongdoll.portfolio.aboutfoongdoll.post.dto.PostRequest;
import foongdoll.portfolio.aboutfoongdoll.post.dto.PostResponse;
import foongdoll.portfolio.aboutfoongdoll.post.entity.Post;
import foongdoll.portfolio.aboutfoongdoll.post.repository.PostRepository;
import foongdoll.portfolio.aboutfoongdoll.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;

    @Override
    public PageResponse<PostResponse> getPosts(String category, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page - 1, 0), size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result;

        if (category == null || category.isBlank() || "all".equalsIgnoreCase(category)) {
            result = postRepository.findAll(pageable);
        } else {
            result = postRepository.findByCategory(category, pageable);
        }

        List<PostResponse> items = result.getContent().stream()
                .map(PostResponse::from)
                .toList();

        return new PageResponse<>(
                items,
                result.getTotalPages(),
                result.getTotalElements(),
                page,
                size
        );
    }

    @Override
    public Optional<PostResponse> getPost(Long postId) {
        return postRepository.findById(postId)
                .map(PostResponse::from);
    }

    @Override
    @Transactional
    public PostResponse createPost(PostRequest request) {
        validateRequest(request);

        Post post = Post.builder()
                .title(request.getTitle().trim())
                .category(normalize(request.getCategory()))
                .keywords(normalize(request.getKeywords()))
                .summary(normalize(request.getSummary()))
                .content(request.getContent())
                .build();

        Post saved = postRepository.save(post);
        return PostResponse.from(saved);
    }

    @Override
    @Transactional
    public PostResponse updatePost(Long postId, PostRequest request) {
        validateRequest(request);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        post.updateFrom(
                request.getTitle().trim(),
                normalize(request.getCategory()),
                normalize(request.getKeywords()),
                normalize(request.getSummary()),
                request.getContent()
        );

        return PostResponse.from(post);
    }

    @Override
    @Transactional
    public void deletePost(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("Post not found");
        }
        postRepository.deleteById(postId);
    }

    private void validateRequest(PostRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("Content is required");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
