(*---
description: Evaluates a random set expression, seed 262, number 2814.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02814 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((2 .. 2147483647) = ({1} \cap FALSE)) -> ((-1) \div (CHOOSE b4468 \in 1..3 : FALSE)) [] OTHER -> CASE (2147483647 < -1) -> (0 % 7) [] OTHER -> (2147483647 \div [x \in 1..2 |-> x]) .. ([a |-> (-7), b |-> (~<<1, 2>>)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02814 failed.
    Attempted to check if the value:
    1
    is an element of the boolean FALSE
---*)
