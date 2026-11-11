(*---
description: A module may not instance itself.
ref: "tla2sany/modanalyzer/SpecObj.java#nonCircularityBody"
features: [missing]
outcome: parse-error
---*)
---- MODULE instance_self ----
INSTANCE instance_self
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file instance_self
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   instance_self.tla --> instance_self.tla
    | *** Errors: 1
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   instance_self.tla --> instance_self.tla
    3002:1 Parsing or semantic analysis failed.
---*)
