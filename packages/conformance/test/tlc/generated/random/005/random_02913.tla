(*---
description: Evaluates a random int expression, seed 262, number 2913.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02913 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b4609 == (-(-(3 % 7))) IN [((b4609 :> b4609) @@ (b4609 :> b4609)) EXCEPT ![((CHOOSE r \in [a : {1}] : TRUE)).a] = Cardinality((Nat \cap 1..3))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 48 to line 14, col 83 of module random_02913
    | (3 :> 3)
---*)
