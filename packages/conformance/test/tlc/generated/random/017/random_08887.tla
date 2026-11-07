(*---
description: Evaluates a random function expression, seed 262, number 8887.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08887 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13768 \in {b13769 \in DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE) : ((TRUE => FALSE) \/ (TRUE => TRUE))} |-> Head(SubSeq(<<7, b13768>>, (-2147483647), Cardinality({1, 2})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<7, 2>>
    , but instead it is
    -2147483647
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<7, 2>>
    , but instead it is
    -2147483647
---*)
