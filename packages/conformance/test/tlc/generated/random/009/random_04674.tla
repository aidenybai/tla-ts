(*---
description: Evaluates a random set expression, seed 262, number 4674.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04674 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({IF (7 \in {1}) THEN (-1 % 0) ELSE IF FALSE THEN 1 ELSE -1, CASE (SUBSET {1} = 1..3) -> (2 \div 3) [] OTHER -> (-1 \div 7)} \cup ((Len(<<3, 1, 2>>) * (0 \div 3)) .. SubSeq(({2, 1, 3} \o <<3, 1, 2>>), Head(<<3, 1, 2>>), ([x \in 1..2 |-> x])[-1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04674 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {1, 2, 3}
---*)
