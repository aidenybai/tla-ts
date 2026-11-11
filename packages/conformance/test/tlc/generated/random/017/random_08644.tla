(*---
description: Evaluates a random record expression, seed 262, number 8644.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08644 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[IF TRUE THEN -1 ELSE 3 EXCEPT !.a = (1 % 1)] EXCEPT !.a = @ + (Head(<<1>>) * (CHOOSE b13380 \in 2..1 : FALSE))] EXCEPT !.a = CASE ((FALSE \/ TRUE) => (FALSE => FALSE)) -> (-(3 + 2147483647)) [] OTHER -> ((2147483647 % 7) * (0 \div [a |-> 1, b |-> TRUE]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08644 failed.
    Attempted to apply EXCEPT construct to the value -1.
---*)
