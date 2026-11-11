(*---
description: Evaluates a random set expression, seed 262, number 2077.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02077 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b3305 \in {3, 7} : (TRUE /\ SUBSET {1})} \ ({b3306 \in Nat : FALSE} \cup (-1 .. -1))) \cup {(-([x \in Nat |-> x + 1])[1]), LET b3307 == (-3) IN [(1 :> 2) EXCEPT ![b3307] = {x \in 1..3 : x > 1}]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02077 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a set of the form SUBSET S.
    line 14, col 39 to line 14, col 56 of module random_02077
---*)
