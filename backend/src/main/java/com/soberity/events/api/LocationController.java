package com.soberity.events.api;

import com.soberity.events.locations.LocationCatalog;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/locations")
public class LocationController {
    private final LocationCatalog locations;
    public LocationController(LocationCatalog locations){this.locations=locations;}
    @GetMapping("/countries") public Map<String,Object> countries(@RequestParam(required=false) String q,@RequestParam(defaultValue="en") String locale,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return locations.countries(q,locale,page,size);}
    @GetMapping("/cities") public Map<String,Object> cities(@RequestParam(required=false) UUID countryId,@RequestParam(required=false) String q,@RequestParam(defaultValue="en") String locale,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return locations.cities(countryId,q,locale,page,size);}
    @GetMapping("/metadata") public Map<String,Object> metadata(){return locations.metadata();}
}
