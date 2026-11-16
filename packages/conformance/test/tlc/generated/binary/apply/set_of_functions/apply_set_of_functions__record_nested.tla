(*---
description: apply of set_of_functions, a SetOfFcnsValue, and record_nested, a RecordValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_set_of_functions__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}])[[a |-> [b |-> <<1>>]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_set_of_functions__record_nested failed.
    A non-function (a set of the form [S -> T]) was applied as a function.
    line 14, col 16 to line 14, col 55 of module apply_set_of_functions__record_nested
---*)
