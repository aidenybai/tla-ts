(*---
description: Evaluates a random int expression, seed 262, number 8155.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08155 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((~(1 \in {1, 2})) <=> (~(\E b12615 \in {} : FALSE))) -> [[[-1 EXCEPT !.a = 7] EXCEPT !.a = (1 \div 1)] EXCEPT !.a = (-(2 + 3))] [] OTHER -> ((CHOOSE b12616 \in UNION {2..1, {x \in 1..3 : x > 1}} : (FALSE => TRUE)) % (IF TRUE THEN -1 ELSE 1 * (0 + 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
