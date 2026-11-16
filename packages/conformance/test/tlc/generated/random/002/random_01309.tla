(*---
description: Evaluates a random set expression, seed 262, number 1309.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01309 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((2147483647 + 3) :> Head(<<1, 2>>)))[((CHOOSE b2083 \in 2..1 : FALSE) % IF TRUE THEN -1 ELSE 3)], (((3 \div 1) - (3 \div 2)) \div ((CHOOSE f \in [{1, 2} \ {1} -> {1}] : TRUE))[(0 % 2)])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01309 failed.
    2178:0 Overflow when computing 2147483647+3
---*)
