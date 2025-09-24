package foongdoll.portfolio.aboutfoongdoll.auth.repository;

import foongdoll.portfolio.aboutfoongdoll.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String id);
}
