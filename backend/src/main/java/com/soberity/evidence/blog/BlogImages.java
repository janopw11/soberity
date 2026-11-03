package com.soberity.evidence.blog;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import javax.imageio.ImageIO;

/** Decode only bounded JPEG/PNG inputs; re-encode to strip metadata and active formats. */
public final class BlogImages {
    private BlogImages() { }
    public record Image(byte[] bytes,int width,int height) { }
    public static Image normalize(byte[] bytes,boolean cover) throws IOException {
        if(bytes.length==0 || bytes.length>5*1024*1024)throw new IllegalArgumentException("Image limit is 5 MB");
        try(var stream=ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers=ImageIO.getImageReaders(stream);
            if(!readers.hasNext())throw new IllegalArgumentException("JPEG or PNG required");
            var reader=readers.next();
            try {
                reader.setInput(stream);
                String format=reader.getFormatName();
                if(!format.equalsIgnoreCase("JPEG")&&!format.equalsIgnoreCase("PNG"))throw new IllegalArgumentException("JPEG or PNG required");
                int w=reader.getWidth(0),h=reader.getHeight(0);
                if(w<=0||h<=0||w>16000||h>16000||(long)w*h>20000000)throw new IllegalArgumentException("Image exceeds 20 megapixels");
                BufferedImage input=reader.read(0);
                double scale=cover?Math.max(1600.0/w,900.0/h):Math.min(1,Math.min(1600.0/w,1600.0/h));
                int ow=cover?1600:Math.max(1,(int)Math.round(w*scale)),oh=cover?900:Math.max(1,(int)Math.round(h*scale));
                BufferedImage output=new BufferedImage(ow,oh,BufferedImage.TYPE_INT_RGB);
                Graphics2D g=output.createGraphics();
                g.setColor(Color.WHITE);g.fillRect(0,0,ow,oh);
                g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                int dw=(int)Math.round(w*scale),dh=(int)Math.round(h*scale);
                g.drawImage(input,(ow-dw)/2,(oh-dh)/2,dw,dh,null);g.dispose();
                var buffer=new ByteArrayOutputStream();ImageIO.write(output,"jpeg",buffer);
                if(buffer.size()>5*1024*1024)throw new IllegalArgumentException("Image too large");
                return new Image(buffer.toByteArray(),ow,oh);
            } finally {reader.dispose();}
        }
    }
}
