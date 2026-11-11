(*---
description: Evaluates a random set expression, seed 262, number 8937.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08937 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {[b13860 \in ({2, 1, 3} \cap 1..3) |-> ((1 :> 2))[b13860]], (DOMAIN [x \in Nat |-> x + 1] \cap UNION {{1, 2}, {x \in 1..3 : x > 1}})} \cup {b13861 \in {(0 \div 7), (7 \div 7)} : (\A b13862 \in (2..1 \cup [x \in Nat |-> x + 1]) : (TRUE /\ TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08937 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
