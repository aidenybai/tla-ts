(*---
description: Evaluates a random bool expression, seed 262, number 4431.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04431 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((SUBSET {1} \ Nat) \ {2147483647, -1}) = DOMAIN [b6973 \in {1, 2} |-> {1}]) \/ [[[a |-> 1, b |-> TRUE] EXCEPT !.a = IF TRUE THEN 7 ELSE -1] EXCEPT !.a = @ + (Cardinality(1..3) * (0 % 3))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)
