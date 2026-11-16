(*---
description: Evaluates a random int expression, seed 262, number 3041.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03041 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({CASE TRUE -> <<1>> [] OTHER -> 7, IF TRUE THEN 2 ELSE 2}).a % ((LET b4835 == 7 IN 1 % (7 + 0)) \div ((CHOOSE b4836 \in {} : FALSE) + (-1 \div 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03041 failed.
    Attempted to compare integer 2 with non-integer:
    <<1>>
---*)
