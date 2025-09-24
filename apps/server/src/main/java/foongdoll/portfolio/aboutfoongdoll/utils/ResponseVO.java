package foongdoll.portfolio.aboutfoongdoll.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ResponseVO<T> {

    private boolean success;
    private String message;
    private T data;

    /**
     * 성공 응답 생성
     */
    public static <T> ResponseVO<T> ok(T data) {
        return ResponseVO.<T>builder()
                .success(true)
                .message("success")
                .data(data)
                .build();
    }

    /**
     * 실패 응답 생성
     */
    public static <T> ResponseVO<T> fail(String message) {
        return ResponseVO.<T>builder()
                .success(false)
                .message(message)
                .build();
    }

    /**
     * DTO 변환 (데이터 payload를 다른 타입으로 변환)
     */
    public <R> ResponseVO<R> mapTo(Class<R> type) {
        ObjectMapper mapper = new ObjectMapper();
        R converted = mapper.convertValue(this.data, type);
        return ResponseVO.<R>builder()
                .success(this.success)
                .message(this.message)
                .data(converted)
                .build();
    }
}
