(*---
description: Evaluates a random function expression, seed 262, number 1062.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01062 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(<<Cardinality(SUBSET {1}), (CHOOSE b1701 \in {1, 2} : <<1, 2>>)>>) EXCEPT ![(((1 \div 1) % (-2)) % ((CHOOSE f \in [{1, 2} -> 1..2] : TRUE))[(2147483647 + 0)])] = ((CHOOSE b1702 \in {2, 2147483647} : [<<>> EXCEPT ![1] = -1]) * Head(<<2147483647, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 50 to line 14, col 83 of module random_01062
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 50 to line 14, col 83 of module random_01062
---*)
