(*---
description: Evaluates a random function expression, seed 262, number 2749.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02749 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4340 \in UNION {UNION {(FALSE \cap {1, 2}), (2147483647 .. 0)}, DOMAIN (7 :> 7)} |-> (((CHOOSE r \in [a : 1..2] : TRUE)).a * (((1 :> 2) @@ <<5, 6>>))[Cardinality(Nat)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02749 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
