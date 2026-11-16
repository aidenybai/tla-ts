(*---
description: Evaluates a random bool expression, seed 262, number 5091.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05091 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x] @@ <<5, 6>>) < (2147483647 * 2147483647)) => ((1 = 7) <=> (FALSE /\ FALSE))) /\ (\E b7917 \in (UNION {{x \in 1..3 : x > 1}, {1, 2}} \cap {2, FALSE}) : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = b7917] = (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05091 failed.
    2178:0 Overflow when computing 2147483647*2147483647
---*)
