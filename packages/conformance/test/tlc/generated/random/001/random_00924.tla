(*---
description: Evaluates a random bool expression, seed 262, number 924.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00924 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(-b1489) : b1489 \in {2147483647, 2147483647}}, UNION {UNION {{1}, 1..3}, {b1490 : b1490 \in {}}}} = {CASE (-1 < 2147483647) -> ([x \in Nat |-> x + 1])[3] [] OTHER -> IF FALSE THEN 2 ELSE 0, IF (TRUE \/ TRUE) THEN SelectSeq(<<>>, LAMBDA e : e > 0) ELSE (2147483647 * 0)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00924 failed.
    Attempted to compare the function <<>> with the value:
    4
---*)
