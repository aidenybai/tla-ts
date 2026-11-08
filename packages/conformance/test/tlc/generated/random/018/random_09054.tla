(*---
description: Evaluates a random record expression, seed 262, number 9054.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09054 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b14072 == LET b14073 == IF FALSE THEN 0 ELSE 7 IN Cardinality(Nat) IN Cardinality({b14072, 7}), b |-> ((({} \cap {x \in 1..3 : x > 1}) = {1, 1}) => ([a |-> 2147483647, b |-> FALSE] = (CHOOSE r \in [a : {}] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09054 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
