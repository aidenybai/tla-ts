(*---
description: Evaluates a random function expression, seed 262, number 9526.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09526 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b14795 \in {2147483647 : b14796 \in {1}} : (FALSE /\ TRUE)) * [Tail(<<>>) EXCEPT ![1] = (CHOOSE b14797 \in {} : TRUE)]) :> ((CHOOSE b14798 \in (SUBSET {1} \cap {1, 2}) : (TRUE => FALSE)) % IF (\A b14799 \in Nat : TRUE) THEN IF FALSE THEN 1 ELSE 2147483647 ELSE CASE TRUE -> 2 [] OTHER -> 7)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09526 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 83 of module random_09526
---*)
