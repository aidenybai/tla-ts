(*---
description: CONSTANTS is the same check.
ref: "tla2sany/semantic/Generator.java#checkIfInRecursiveSection"
features: [recursive]
outcome: parse-error
---*)
---- MODULE section_has_constants_plural ----
RECURSIVE F
CONSTANTS a, b
F == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 14 of module section_has_constants_plural
    | A declaration may not appear within a recursive definition section.
    3002:1 Parsing or semantic analysis failed.
---*)
