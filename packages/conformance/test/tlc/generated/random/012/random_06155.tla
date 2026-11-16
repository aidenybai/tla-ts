(*---
description: Evaluates a random record expression, seed 262, number 6155.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06155 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (0 + 2147483647), b |-> ({2, 1, 3} \subseteq SUBSET {1})] EXCEPT !.a = [b9469 \in ({1, 2} \cup 1..3) |-> IF FALSE THEN 7 ELSE 0]] EXCEPT !.a = @ + (LET b9470 == (-2) IN Cardinality({x \in 1..3 : x > 1}) % IF (-1 = 7) THEN (7 * 2147483647) ELSE LET b9471 == 2147483647 IN 7)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06155 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
