(*---
description: Evaluates a random seq expression, seed 262, number 2166.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02166 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(<<LET b3418 == 1 IN -1, (3 % 7)>>), ((CHOOSE f \in [{} -> {1, 2} \cap {2}] : TRUE))[LET b3419 == (CHOOSE b3420 \in {1} : FALSE) IN CASE FALSE -> [a |-> 1] [] OTHER -> b3419]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02166 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 121 to line 14, col 148 of module random_02166
---*)
