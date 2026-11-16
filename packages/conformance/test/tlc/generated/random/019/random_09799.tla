(*---
description: Evaluates a random function expression, seed 262, number 9799.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09799 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE f \in [2..1 -> {1}] : TRUE) EXCEPT ![Cardinality(2..1)] = (1 % 0)])[Head((<<1>> \o <<1>>))] :> (-((CHOOSE b15205 \in SUBSET {1} : FALSE) * IF FALSE THEN 1 ELSE 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 52 of module random_09799
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09799 failed.
    Attempted to apply function:
    <<>>
    to argument 1, which is not in the domain of the function.
---*)
