(*---
description: Evaluates a random record expression, seed 262, number 5457.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05457 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[SortSeq(SubSeq(<<1>>, 7, 2), LAMBDA p, q : p < q) EXCEPT !.a = (-IF FALSE THEN 2 ELSE -1)] EXCEPT !.a = CASE (\A b8448 \in {b8449 \in SUBSET {1} : [x \in 1..2 |-> x]} : (\E b8450 \in {1, 2} : TRUE)) -> Head(Tail(<<>>)) [] OTHER -> IF (~0) THEN (3 % 1) ELSE (7 % 3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05457 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
