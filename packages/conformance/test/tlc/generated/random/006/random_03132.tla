(*---
description: Evaluates a random function expression, seed 262, number 3132.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03132 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality((1..3 \ SUBSET {1})) :> (Head(<<3, 1, 2>>) % (1 * 2147483647))) @@ [b5004 \in (Cardinality({1}) .. IF TRUE THEN 0 ELSE 2147483647) |-> Cardinality({b5005 \in Nat : FALSE})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03132 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
