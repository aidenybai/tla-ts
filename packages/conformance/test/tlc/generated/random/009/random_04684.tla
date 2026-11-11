(*---
description: Evaluates a random record expression, seed 262, number 4684.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04684 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE), b |-> ((1 \in FALSE) \/ (2 = -1))] EXCEPT !.a = CASE (Head(<<3, 1, 2>>) < CASE TRUE -> 2147483647 [] OTHER -> 3) -> CASE (FALSE /\ TRUE) -> (0 + 0) [] OTHER -> Len(<<3, 1, 2>>) [] OTHER -> ((7 \div 2147483647) + IF TRUE THEN 2147483647 ELSE -1)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04684 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
