(*---
description: A temporal formula cannot be a set element.
ref: "tla2sany/semantic/OpApplNode.java#levelCheck"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE level_temporal_as_set_element ----
VARIABLE v
A == {[]v}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 6 to line 9, col 10 of module level_temporal_as_set_element
    | Level error in applying operator $SetEnumerate:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
