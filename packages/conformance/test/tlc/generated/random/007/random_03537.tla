(*---
description: Evaluates a random function expression, seed 262, number 3537.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03537 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b5591 \in (SUBSET {1} \ SUBSET {1}) |-> ([a |-> 1, b |-> TRUE]).a] @@ (CHOOSE f \in [{} -> {0} \cup {1}] : TRUE)) @@ ([[{1} EXCEPT ![-1] = 2147483647] EXCEPT ![(-1 + -1)] = Cardinality({2, 1, 3})] @@ [[b5592 \in {x \in 1..3 : x > 1} |-> b5592] EXCEPT ![CASE TRUE -> 0 [] OTHER -> 1] = (-3)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03537 failed.
    Attempted to apply EXCEPT construct to the value {1}.
---*)
