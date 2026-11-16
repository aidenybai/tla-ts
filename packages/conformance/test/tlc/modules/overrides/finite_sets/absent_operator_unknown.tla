(*---
description: "IsFiniteSet is not in the replacing file, so it does not exist."
ref: "util/SimpleFilenameToStream.java#locate"
features: [overrides]
includes: [FiniteSets.tla]
outcome: parse-error
---*)
---- MODULE absent_operator_unknown ----
EXTENDS FiniteSets
Test == IsFiniteSet({})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 9 to line 10, col 19 of module absent_operator_unknown
    | Unknown operator: `IsFiniteSet'.
    3002:1 Parsing or semantic analysis failed.
---*)
