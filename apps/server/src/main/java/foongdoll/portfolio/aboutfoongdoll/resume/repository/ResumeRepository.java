package foongdoll.portfolio.aboutfoongdoll.resume.repository;

import foongdoll.portfolio.aboutfoongdoll.resume.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {

    Optional<Resume> findTopByOrderByIdAsc();
}
