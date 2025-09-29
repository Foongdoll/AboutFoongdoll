package foongdoll.portfolio.aboutfoongdoll.post.repository;

import foongdoll.portfolio.aboutfoongdoll.post.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByCategory(String category, Pageable pageable);

}
