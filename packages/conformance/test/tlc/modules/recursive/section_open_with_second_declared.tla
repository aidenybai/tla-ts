(*---
description: The section stays open until every declared operator is defined.
ref: "tla2sany/semantic/Generator.java#checkIfInRecursiveSection"
features: [recursive]
outcome: parse-error
---*)
---- MODULE section_open_with_second_declared ----
RECURSIVE F, G
F == G
ASSUME TRUE
G == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 11 of module section_open_with_second_declared
    | An ASSUME may not appear within a recursive definition section.
    3002:1 Parsing or semantic analysis failed.
---*)
