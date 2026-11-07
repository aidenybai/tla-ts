(*---
description: Evaluates a random function expression, seed 262, number 2593.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02593 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE) @@ [(([x \in 1..2 |-> x])[7] :> (1 * [x \in Nat |-> x + 1])) EXCEPT ![CASE (<<1, 2>> = [a |-> 1, b |-> TRUE]) -> (7 * 2147483647) [] OTHER -> (-1 * 2)] = IF (2 \in 1..3) THEN ([a |-> 1, b |-> TRUE]).a ELSE (3 % -1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02593 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    7
    which is not in its domain.
---*)
