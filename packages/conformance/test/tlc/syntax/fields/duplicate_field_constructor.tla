(*---
description: A repeated field in a record constructor is an error even with keyword fields.
ref: "tla2sany/semantic/Generator.java#processRcdForm"
features: [fields]
outcome: parse-error
---*)
---- MODULE duplicate_field_constructor ----
Test == [IF |-> 1, a |-> 2, a |-> 3].a = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 29 to line 8, col 29 of module duplicate_field_constructor
    | Non-unique fields in constructor.
    3002:1 Parsing or semantic analysis failed.
---*)
