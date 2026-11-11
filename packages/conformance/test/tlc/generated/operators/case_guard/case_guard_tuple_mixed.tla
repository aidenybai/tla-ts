(*---
description: case_guard applied to tuple_mixed, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_case
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE case_guard_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE <<1, "a", {TRUE}>> -> 1 [] OTHER -> 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module case_guard_tuple_mixed failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 21 to line 14, col 38 of module case_guard_tuple_mixed
---*)
