(*---
description: Evaluates a random int expression, seed 262, number 1175.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01175 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b1881 \in UNION {({1} \ {1}), {b1882 \in {} : FALSE}} : (~[b1883 \in 2..1 |-> 1])) + (((CHOOSE r \in [a : {1}] : TRUE)).a - ([b1884 \in <<1>> |-> 2147483647])[(CHOOSE b1885 \in 1..3 : FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01175 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 105 of module random_01175
---*)
