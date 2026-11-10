(*---
description: "Two files that extend each other form a cycle, reached from a third."
ref: "tla2sany/modanalyzer/SpecObj.java#nonCircularityBody"
features: [missing]
includes: [FixCycleA.tla, FixCycleB.tla]
outcome: parse-error
---*)
---- MODULE cycle_through_extends_files ----
EXTENDS FixCycleA
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file cycle_through_extends_files
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   FixCycleA.tla --> FixCycleB.tla --> FixCycleA.tla
    | *** Errors: 1
    | Unknown location
    | Circular dependency among .tla files; dependency cycle is:
    |   FixCycleA.tla --> FixCycleB.tla --> FixCycleA.tla
    3002:1 Parsing or semantic analysis failed.
---*)
