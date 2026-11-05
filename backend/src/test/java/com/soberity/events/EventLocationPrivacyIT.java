package com.soberity.events;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.soberity.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.web.servlet.MockMvc;

@ExtendWith(OutputCaptureExtension.class)
class EventLocationPrivacyIT extends AbstractIntegrationTest {
    @Autowired MockMvc mvc;
    @Test void requestCoordinatesStayOutOfLogsErrorsAndQueryUrls(CapturedOutput output)throws Exception {
        String body="{\"latitude\":61.12345678,\"longitude\":17.98765432}";
        String response=mvc.perform(post("/api/v1/events/nearby").contentType("application/json").content(body))
            .andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store")).andReturn().getResponse().getContentAsString();
        assertThat(response).doesNotContain("61.12345678","17.98765432");
        String invalid=mvc.perform(post("/api/v1/events/nearby").contentType("application/json").content("{\"latitude\":\"private-marker-61.12345678\"}"))
            .andExpect(status().isBadRequest()).andReturn().getResponse().getContentAsString();
        assertThat(invalid).doesNotContain("private-marker","61.12345678");
        mvc.perform(get("/api/v1/events?latitude=61.12345678&longitude=17.98765432")).andExpect(status().isBadRequest());
        assertThat(output.getAll()).doesNotContain("61.12345678","17.98765432","private-marker");
    }
}
