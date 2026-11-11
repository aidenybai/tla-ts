(*---
description: Evaluates a random set expression, seed 262, number 7229.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07229 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((TRUE \/ FALSE) /\ (-1 \in SUBSET {1})) /\ (Head(<<3, 1, 2>>) < (0 % 3))), IF (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) = [b11106 \in {x \in 1..3 : x > 1} |-> 7]) THEN ((0 % 7) % Len(<<>>)) ELSE IF (SUBSET {1} = 2..1) THEN (7 * 3) ELSE IF TRUE THEN 3 ELSE 2147483647})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07229 failed.
    Attempted to check if the non-enumerable value
    -1
    is element of
    {{}, {1}}
---*)
