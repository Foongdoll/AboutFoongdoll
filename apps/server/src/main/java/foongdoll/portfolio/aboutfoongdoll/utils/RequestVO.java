package foongdoll.portfolio.aboutfoongdoll.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;

import java.util.HashMap;

@Getter @Setter
@NoArgsConstructor @Builder
public class RequestVO extends HashMap<String, Object> {

    /**
     * 파라미터 추가
     */
    @Override
    public Object put(String key, Object value) {
        return super.put(key, value); // ✅ super로 호출
    }

    /**
     * 파라미터 조회
     */
    @Override
    public Object get(Object key) {
        return super.get(key); // ✅ super로 호출
    }

    /**
     * 특정 타입으로 변환해서 가져오기
     */
    public <T> T getAs(String key, Class<T> type) {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.convertValue(super.get(key), type);
    }

    /**
     * VO 전체를 특정 DTO로 변환
     */
    public <T> T toDTO(Class<T> type) {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.convertValue(this, type);
    }
}
