(*---
description: Evaluates a random int expression, seed 262, number 3086.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03086 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-IF (~([a |-> 1] = [a |-> 1])) THEN (CHOOSE b4914 \in {b4915 : b4915 \in 2..1} : (FALSE \/ FALSE)) ELSE (-(2147483647 * 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03086 failed.
    2178:0 Overflow when computing 2147483647*2147483647
---*)
