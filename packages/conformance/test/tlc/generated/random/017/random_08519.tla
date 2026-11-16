(*---
description: Evaluates a random bool expression, seed 262, number 8519.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08519 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((FALSE => TRUE) /\ (FALSE <=> FALSE)) => [a |-> CASE FALSE -> 0 [] OTHER -> 2, b |-> (<<>> = FALSE)]) \/ (({2147483647, 1} \cup ({1} \ {x \in 1..3 : x > 1})) \cap ({b13199 : b13199 \in {}} \cup UNION {2..1, [a |-> 1]}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08519 failed.
    Attempted to check equality of the function <<>> with the value:
    FALSE
---*)
