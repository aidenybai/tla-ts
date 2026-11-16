(*---
description: A named ASSUME may not sit in a recursive section.
ref: "tla2sany/semantic/Generator.java#checkIfInRecursiveSection"
features: [recursive]
outcome: parse-error
---*)
---- MODULE section_has_assume_named ----
RECURSIVE F
ASSUME A == TRUE
F == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 16 of module section_has_assume_named
    | An ASSUME may not appear within a recursive definition section.
    3002:1 Parsing or semantic analysis failed.
---*)
