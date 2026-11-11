(*---
description: "A record constructor may not repeat a field, with another between."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE record_duplicate_field_not_adjacent ----
A == [a |-> 1, b |-> 2, a |-> 3]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 25 to line 8, col 25 of module record_duplicate_field_not_adjacent
    | Non-unique fields in constructor.
    3002:1 Parsing or semantic analysis failed.
---*)
