(*---
description: Evaluates a random bool expression, seed 262, number 7999.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07999 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1} \cup {2, 1, 3}) \ ({1} \cup 1..3)) \subseteq {b12349 \in DOMAIN [x \in Nat |-> x + 1] : (FALSE <=> TRUE)}) /\ ((~(7 \in {x \in 1..3 : x > 1})) = (([x \in 1..2 |-> x])[2147483647] + (2 \div 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07999 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
