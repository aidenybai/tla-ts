(*---
description: A repeated field in a set of records is an error.
ref: "tla2sany/semantic/Generator.java#processRcdForm"
features: [fields]
outcome: parse-error
---*)
---- MODULE duplicate_field_set ----
Test == [a : {1}, a : {2}] = {}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 19 to line 8, col 19 of module duplicate_field_set
    | Non-unique fields in constructor.
    3002:1 Parsing or semantic analysis failed.
---*)
