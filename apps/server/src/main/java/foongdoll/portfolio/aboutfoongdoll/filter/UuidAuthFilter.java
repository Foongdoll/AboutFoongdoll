package foongdoll.portfolio.aboutfoongdoll.filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class UuidAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String uri = request.getRequestURI();
        String method = request.getMethod();

        if (HttpMethod.OPTIONS.matches(method) || HttpMethod.GET.matches(method) || "/api/auth/login".equals(uri) || "/api/auth/join".equals(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("token") == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "로그인 필요");
            return;
        }

        String sessionUuid = (String) session.getAttribute("token");

        String requestUuid = request.getHeader("Authorization");
        if (requestUuid == null) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "UUID 누락");
            return;
        }

        if (!sessionUuid.equals(requestUuid)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "UUID 불일치");
            return;
        }

        // 통과
        filterChain.doFilter(request, response);
    }
}
