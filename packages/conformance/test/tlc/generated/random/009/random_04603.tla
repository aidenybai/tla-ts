(*---
description: Evaluates a random function expression, seed 262, number 4603.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04603 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7209 \in ((Cardinality(<<5, 6>>) < Len(<<1, 2>>)) \cap UNION {{b7210 \in 1..3 : TRUE}, DOMAIN [a |-> 1, b |-> TRUE]}) |-> (CHOOSE b7211 \in UNION {UNION {1..3, {}}, {2147483647, -1}} : ((TRUE => FALSE) => (FALSE \/ FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04603 failed.
    2181:0 Attempted to compute cardinality of the value
    <<5, 6>>
---*)
