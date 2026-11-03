package com.soberity.evidence;
import static org.assertj.core.api.Assertions.*;
import com.soberity.evidence.blog.BlogDocument;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
class BlogDocumentTest {
 private final JsonMapper json=JsonMapper.builder().build();
 @Test void preservesFormattingAndDropsUntrustedAttributes() {
  var result=BlogDocument.check(json.readTree("""
   {"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":"justify","onclick":"alert(1)"},"content":[{"type":"text","text":"A clear beginning","marks":[{"type":"bold"}]}]}]}
   """));
  assertThat(result.text()).isEqualTo("A clear beginning");
  assertThat(result.document().toString()).contains("justify","bold").doesNotContain("onclick","alert");
 }
 @Test void refusesScriptLinksAndForeignImageSources() {
  for(String document:new String[]{
    "{\"type\":\"doc\",\"content\":[{\"type\":\"script\"}]}",
    "{\"type\":\"doc\",\"content\":[{\"type\":\"text\",\"text\":\"Link\",\"marks\":[{\"type\":\"link\",\"attrs\":{\"href\":\"javascript:alert(1)\"}}]}]}",
    "{\"type\":\"doc\",\"content\":[{\"type\":\"image\",\"attrs\":{\"src\":\"https://example.test/tracking.png\",\"alt\":\"Unowned\"}}]}"}) {
   assertThatThrownBy(()->BlogDocument.check(json.readTree(document))).isInstanceOf(IllegalArgumentException.class);
  }
 }
 @Test void recordsUploadedImageIdsAndRequiresAltText() {
  String id="10000000-0000-4000-8000-000000000001";
  var doc=json.readTree("{\"type\":\"doc\",\"content\":[{\"type\":\"image\",\"attrs\":{\"src\":\"/api/v1/science/media/"+id+"\",\"alt\":\"A useful description\"}}]}");
  assertThat(BlogDocument.check(doc).images()).containsExactly(java.util.UUID.fromString(id));
  assertThatThrownBy(()->BlogDocument.check(json.readTree(doc.toString().replace("A useful description","")))).isInstanceOf(IllegalArgumentException.class);
 }
}
