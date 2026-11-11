(*---
description: apply of function_empty, a FcnRcdValue, and record_nested, a RecordValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_empty__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {} |-> x])[[a |-> [b |-> <<1>>]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function_empty__record_nested failed.
    In applying the function
    <<>>,
    the first argument is:
    [a |-> [b |-> <<1>>]]
    which is not in its domain.
---*)
