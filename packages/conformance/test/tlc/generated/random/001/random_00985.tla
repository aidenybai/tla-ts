(*---
description: Evaluates a random function expression, seed 262, number 985.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00985 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b1581 \in {1, 2} |-> (b1581 * b1581)] @@ [(3 :> -1) EXCEPT ![(2147483647 \in {1})] = Head(<<>>)]) @@ [b1582 \in DOMAIN ((1 :> 2) @@ [x \in 1..2 |-> x]) |-> IF (FALSE /\ TRUE) THEN ([a |-> 1]).a ELSE (2 + b1582)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00985 failed.
    Attempted to check equality of integer 3 with non-integer:
    FALSE
---*)
