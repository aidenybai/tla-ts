(*---
description: "A repeated field name in a record constructor is rejected by the parser, so RecordValue.sort never sees one from source."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE duplicate_field_is_parse_error ----
EXTENDS Integers
Test == [a |-> 1, a |-> 2] = [a |-> 1]
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 19 to line 9, col 19 of module duplicate_field_is_parse_error
    | Non-unique fields in constructor.
    3002:1 Parsing or semantic analysis failed.
---*)
