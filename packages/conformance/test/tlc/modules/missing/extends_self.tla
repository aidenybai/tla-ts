(*---
description: A module may not extend itself.
ref: "tla2sany/modanalyzer/SpecObj.java#nonCircularityBody"
features: [missing]
outcome: parse-error
---*)
---- MODULE extends_self ----
EXTENDS extends_self
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file extends_self
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   extends_self.tla --> extends_self.tla
    | *** Errors: 1
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   extends_self.tla --> extends_self.tla
    3002:1 Parsing or semantic analysis failed.
---*)
