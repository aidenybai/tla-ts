(*---
description: Evaluates a random int expression, seed 262, number 9946.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09946 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b15472 \in ((({x \in 1..3 : x > 1} \cup 1..3) \cap (2147483647 .. 7)) \cup (({1} \cap {2, 1, 3}) \cup UNION {{2, 1, 3}, 2..1})) : (((-3) \in (Nat \cap 2..1)) <=> ((-1 + 2147483647) \in [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b15472]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09946 failed.
    Attempted to check if element:
    2147483646
    is in the record:
    [a |-> 2, b |-> TRUE]
---*)
