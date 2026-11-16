(*---
description: Evaluates a random bool expression, seed 262, number 6220.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06220 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b9574 \in {b9575 \in {CASE FALSE -> b9576 [] OTHER -> 3 : b9576 \in DOMAIN (1 :> 2)} : ((3 => FALSE) => (b9575 = b9575))} : ((-(b9574 % b9574)) < ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06220 failed.
    Attempted to evaluate an expression of form P => Q when P was
    an integer.
    line 14, col 109 to line 14, col 118 of module random_06220
---*)
