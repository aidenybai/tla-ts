(*---
description: A module may not instance itself by name.
ref: "tla2sany/modanalyzer/SpecObj.java#nonCircularityBody"
features: [missing]
outcome: parse-error
---*)
---- MODULE named_instance_self ----
M == INSTANCE named_instance_self
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file named_instance_self
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   named_instance_self.tla --> named_instance_self.tla
    | *** Errors: 1
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   named_instance_self.tla --> named_instance_self.tla
    3002:1 Parsing or semantic analysis failed.
---*)
