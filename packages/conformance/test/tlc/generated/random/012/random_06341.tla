(*---
description: Evaluates a random set expression, seed 262, number 6341.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06341 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b9744 \in ({-1, 0} \cup DOMAIN (1 :> 2)) : (~(<<1>> = [a |-> 1]))), Cardinality((({x \in 1..3 : x > 1} \ 1) \ UNION {Nat, Nat}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06341 failed.
    Attempted to compare an integer with non-integer:
    "a".
---*)
