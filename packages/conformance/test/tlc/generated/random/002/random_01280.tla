(*---
description: Evaluates a random bool expression, seed 262, number 1280.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01280 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = @ + LET b2036 == 2147483647 IN 0] EXCEPT !.a = @ + IF ({x \in 1..3 : x > 1} \subseteq {2, 1, 3}) THEN (CHOOSE b2037 \in {1, 2} : TRUE) ELSE CASE FALSE -> 0 [] OTHER -> 0] = [(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = (Head(FALSE) + ([x \in Nat |-> x + 1])[2])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01280 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)
