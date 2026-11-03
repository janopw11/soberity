package com.soberity.evidence;
import static org.assertj.core.api.Assertions.*;
import com.soberity.evidence.blog.BlogImages;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
class BlogImagesTest {
    static { System.setProperty("java.awt.headless","true"); }
 @Test void stripsFormatAndKeepsInlineAspectRatio() throws Exception {
  var bytes=new ByteArrayOutputStream();ImageIO.write(new BufferedImage(2000,1000,BufferedImage.TYPE_INT_RGB),"png",bytes);
  var image=BlogImages.normalize(bytes.toByteArray(),false);
  assertThat(image.width()).isEqualTo(1600);assertThat(image.height()).isEqualTo(800);
  assertThat(image.bytes()[0]).isEqualTo((byte)0xff);
 }
 @Test void rejectsUnsupportedFiles() {
  assertThatThrownBy(()->BlogImages.normalize("<svg onload='alert(1)'/>".getBytes(),true)).isInstanceOf(IllegalArgumentException.class);
 }
}
