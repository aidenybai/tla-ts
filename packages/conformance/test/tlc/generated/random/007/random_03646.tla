(*---
description: Evaluates a random bool expression, seed 262, number 3646.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03646 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 2147483647, b |-> FALSE] EXCEPT !.a = @ + ((1 :> 2))[1]] EXCEPT !.a = LET b5764 == (2 + 3) IN IF FALSE THEN b5764 ELSE b5764] EXCEPT !.a = @ + CASE (\E b5765 \in {0, 2} : (-1 = b5765)) -> Cardinality((1..3 \cap {1})) [] OTHER -> ((3 * 3) % (2 \div 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2
    2178:0 Overflow when computing 2147483647+2
---*)
