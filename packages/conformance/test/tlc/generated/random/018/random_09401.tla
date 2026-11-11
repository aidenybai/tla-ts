(*---
description: Evaluates a random bool expression, seed 262, number 9401.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09401 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN [x \in 1..2 |-> x] \in ({2, 1, 3} \ {x \in 1..3 : x > 1})) => (IF FALSE THEN 7 ELSE -1 = (7 + 7))) <=> (\E b14585 \in ((TRUE \ {2, 1, 3}) \ DOMAIN [x \in Nat |-> x + 1]) : SelectSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09401 failed.
    Attempted to check equality of integer 1 with non-integer:
    1..2
---*)
