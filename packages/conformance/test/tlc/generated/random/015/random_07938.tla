(*---
description: Evaluates a random int expression, seed 262, number 7938.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07938 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (FALSE /\ TRUE) -> LET b12252 == 0 IN b12252 [] OTHER -> (1 % 7) - (-Head(<<>>))) - ([b12253 \in {2, 2147483647} |-> (0 * b12253)])[([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] - (-1))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
