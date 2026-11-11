(*---
description: Evaluates a random bool expression, seed 262, number 4136.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04136 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6511 \in ((Cardinality(Nat) .. LET b6512 == 3 IN b6512) \ DOMAIN [b6513 \in <<>> |-> b6513]) : (DOMAIN (b6511 :> b6511) = ((b6511 \div 7) .. (b6511 \div {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04136 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
