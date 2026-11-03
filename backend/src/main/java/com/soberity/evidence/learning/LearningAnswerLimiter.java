package com.soberity.evidence.learning;

import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Component;

/** Bounded, short-lived, per-process protection; does not persist addresses or identity. */
@Component
public class LearningAnswerLimiter {
    private record Bucket(double tokens, long lastSeen) { }
    private final Map<String,Bucket> buckets=new HashMap<>();
    public synchronized boolean allow(String key) {
        long now=System.nanoTime();
        buckets.entrySet().removeIf(entry -> now-entry.getValue().lastSeen()>120_000_000_000L);
        var previous=buckets.get(key);
        if(previous==null && buckets.size()>=10000) return false;
        double tokens=previous==null?30:Math.min(30,previous.tokens()+(now-previous.lastSeen())/1_000_000_000.0);
        boolean accepted=tokens>=1;
        buckets.put(key,new Bucket(accepted?tokens-1:tokens,now));
        return accepted;
    }
}
