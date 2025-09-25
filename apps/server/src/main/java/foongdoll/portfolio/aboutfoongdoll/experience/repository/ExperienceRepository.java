package foongdoll.portfolio.aboutfoongdoll.experience.repository;

import foongdoll.portfolio.aboutfoongdoll.experience.entity.Experience;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExperienceRepository extends JpaRepository<Experience, Long> {

    @EntityGraph(attributePaths = "company")
    List<Experience> findByCompanyCompanyCodeOrderByIdAsc(String companyCode);

    @EntityGraph(attributePaths = "company")
    List<Experience> findAllByOrderByIdAsc();

    Optional<Experience> findByExperienceCode(String experienceCode);
}
