(*---
description: Evaluates a random record expression, seed 262, number 7765.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07765 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Cardinality({x \in 1..3 : x > 1}) \div (<<5, 6>>)[0]) + LET b11973 == (2 + 1) IN (CHOOSE b11974 \in Nat : [x \in 1..2 |-> x])), b |-> (\E b11975 \in {(CHOOSE b11976 \in {2, 1, 3} : FALSE), LET b11977 == 0 IN 1} : (\A b11978 \in (b11975 .. 1) : ({} \subseteq Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07765 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
