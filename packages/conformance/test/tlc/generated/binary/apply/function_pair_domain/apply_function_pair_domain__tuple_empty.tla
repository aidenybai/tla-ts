(*---
description: apply of function_pair_domain, a FcnRcdValue, and tuple_empty, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
  - tlc-bug
flags:
  - expression
contexts:
  - assume
outcome: any
correct:
  all:
    exit: 10
    transcript: |-
      2105:1 Evaluating assumption line 26, col 8 to line 26, col 11 of module apply_function_pair_domain__tuple_empty failed.
      In applying the function
      (<<1, 2>> :> 3),
      the argument list is:
      <<>>
      which does not match its formal parameter.
---*)
---- MODULE apply_function_pair_domain__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y])[<<>>])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 26, col 8 to line 26, col 11 of module apply_function_pair_domain__tuple_empty failed.
    Index 0 out of bounds for length 0
---*)
