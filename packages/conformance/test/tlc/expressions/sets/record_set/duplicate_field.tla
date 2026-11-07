(*---
description: "A repeated field name in a set of records is rejected by the parser, before TLC evaluates anything."
ref: "tla2sany/semantic/Generator.java#generateSetOfRcds"
flags: [expression]
outcome: parse-error
---*)
---- MODULE duplicate_field ----
EXTENDS Integers
Test == [a : {1}, a : {2}] # {}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 19 to line 9, col 19 of module duplicate_field
    | Non-unique fields in constructor.
    3002:1 Parsing or semantic analysis failed.
---*)
