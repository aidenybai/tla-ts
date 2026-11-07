(*---
description: Evaluates a random record expression, seed 262, number 1405.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01405 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((1 * 0) :> ([x \in Nat |-> x + 1])[3]))[IF (FALSE => FALSE) THEN LET b2233 == 2 IN b2233 ELSE (CHOOSE b2234 \in <<>> : TRUE)], b |-> ((IF TRUE THEN 2147483647 ELSE -1 % (3 - 0)) < CASE (TRUE \/ TRUE) -> Head(<<1>>) [] OTHER -> Head(<<3, 1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01405 failed.
    Attempted to apply function:
    (0 :> 4)
    to argument 2, which is not in the domain of the function.
---*)
