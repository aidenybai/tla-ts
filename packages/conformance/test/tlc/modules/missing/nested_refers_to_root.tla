(*---
description: A nested module may not extend the root it sits inside.
ref: "tla2sany/modanalyzer/SpecObj.java#nonCircularityBody"
features: [missing]
outcome: parse-error
---*)
---- MODULE nested_refers_to_root ----
---- MODULE I ----
EXTENDS nested_refers_to_root
====
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file nested_refers_to_root
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   nested_refers_to_root.tla --> nested_refers_to_root.tla
    | *** Errors: 1
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   nested_refers_to_root.tla --> nested_refers_to_root.tla
    3002:1 Parsing or semantic analysis failed.
---*)
