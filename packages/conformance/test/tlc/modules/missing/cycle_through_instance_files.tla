(*---
description: "Two files that instance each other form a cycle, reached from a third."
ref: "tla2sany/modanalyzer/SpecObj.java#nonCircularityBody"
features: [missing]
includes: [FixCycleC.tla, FixCycleD.tla]
outcome: parse-error
---*)
---- MODULE cycle_through_instance_files ----
INSTANCE FixCycleC
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file cycle_through_instance_files
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   FixCycleC.tla --> FixCycleD.tla --> FixCycleC.tla
    | *** Errors: 1
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   FixCycleC.tla --> FixCycleD.tla --> FixCycleC.tla
    3002:1 Parsing or semantic analysis failed.
---*)
