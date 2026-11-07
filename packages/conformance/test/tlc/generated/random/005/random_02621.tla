(*---
description: Evaluates a random bool expression, seed 262, number 2621.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02621 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE))[(2147483647 + 2147483647)] \div (([a |-> 1]).a \div (-2))) = CASE (-(-7)) -> IF (FALSE => FALSE) THEN (-1 \div 2) ELSE Len(<<>>) [] OTHER -> ((TRUE :> 1))[((1 :> 2))[2]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2147483647
    2178:0 Overflow when computing 2147483647+2147483647
---*)
