package foongdoll.portfolio.aboutfoongdoll.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;

import java.util.HashMap;
import java.util.Map;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class RequestVO {

    private Map<String, Object> params = new HashMap<>();

    /**
     * 파라미터 추가
     */
    public void put(String key, Object value) {
        params.put(key, value);
    }

    /**
     * 파라미터 조회
     */
    public Object get(String key) {
        return params.get(key);
    }

    /**
     * 특정 타입으로 변환해서 가져오기
     */
    public <T> T getAs(String key, Class<T> type) {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.convertValue(params.get(key), type);
    }

    /**
     * VO 전체를 특정 DTO로 변환
     */
    public <T> T toDTO(Class<T> type) {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.convertValue(params, type);
    }
}
