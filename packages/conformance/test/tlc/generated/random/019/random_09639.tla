(*---
description: Evaluates a random bool expression, seed 262, number 9639.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09639 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b14965 == ([[a |-> 1] EXCEPT !.a = @ + 2]).a IN (Len(<<3, 1, 2>>) \div IF FALSE THEN b14965 ELSE b14965) < (IF (2 \in 1..3) THEN (CHOOSE b14966 \in {1} : [a |-> 1, b |-> TRUE]) ELSE (1 \div 1) \div (Head(<<3, 1, 2>>) - Head(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 151 to line 14, col 195 of module random_09639
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 151 to line 14, col 195 of module random_09639
---*)
