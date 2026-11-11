(*---
description: Evaluates a random record expression, seed 262, number 4865.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04865 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + ([b7577 \in {b7578 : b7578 \in [x \in 1..2 |-> x]} |-> Head(<<1, 2>>)])[Cardinality((0 .. 2))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04865 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1, 2>>.
    line 14, col 103 to line 14, col 120 of module random_04865
---*)
