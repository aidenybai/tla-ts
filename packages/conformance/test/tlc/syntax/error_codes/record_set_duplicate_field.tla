(*---
description: A set-of-records constructor may not repeat a field.
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE record_set_duplicate_field ----
A == [a : {1}, a : {2}]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 16 to line 8, col 16 of module record_set_duplicate_field
    | Non-unique fields in constructor.
    3002:1 Parsing or semantic analysis failed.
---*)
