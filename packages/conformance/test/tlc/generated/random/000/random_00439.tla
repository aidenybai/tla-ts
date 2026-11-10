(*---
description: Evaluates a random bool expression, seed 262, number 439.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00439 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b714 \in UNION {{(b715 + TRUE) : b715 \in (Nat \cap 2..1)}, ({3 : b716 \in 1..3} \cap DOMAIN 2147483647)} : (DOMAIN [[a |-> 1, b |-> TRUE] EXCEPT !.a = b714] \subseteq DOMAIN ([x \in Nat |-> x + 1] @@ <<5, 6>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00439 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 106 to line 14, col 122 of module random_00439
---*)
