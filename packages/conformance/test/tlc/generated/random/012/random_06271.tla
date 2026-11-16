(*---
description: Evaluates a random bool expression, seed 262, number 6271.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06271 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality((3 * 3)) \in DOMAIN [{x \in 1..3 : x > 1} EXCEPT ![3] = 0]) <=> ([[TRUE EXCEPT !.a = @ + 7] EXCEPT !.a = @ + Cardinality(1..3)] => ((2 \div 7) < Head(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06271 failed.
    2181:0 Attempted to compute cardinality of the value
    9
---*)
