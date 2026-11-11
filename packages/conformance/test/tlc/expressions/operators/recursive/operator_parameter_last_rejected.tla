(*---
description: "An operator parameter in the last position of a definition declared RECURSIVE is reported as an arity mismatch."
ref: "tla2sany/semantic/Generator.java#processOperator"
flags: [expression]
outcome: parse-error
---*)
---- MODULE operator_parameter_last_rejected ----
EXTENDS Integers, Sequences
RECURSIVE Map(_, _)
Map(s, f(_)) == IF s = <<>> THEN <<>> ELSE Map(Tail(s), f)
Test == Map(<<1>>, LAMBDA x : x) = <<>>
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 58 of module operator_parameter_last_rejected
    | Definition of Map has different arity than its RECURSIVE declaration.
    3002:1 Parsing or semantic analysis failed.
---*)
