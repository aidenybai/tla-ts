(*---
description: Evaluates a random seq expression, seed 262, number 4412.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04412 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[SelectSeq(<<-1, 0>>, LAMBDA e : e > 0) EXCEPT ![1] = (Head(<<>>) + (-1 \div 3))] EXCEPT ![1] = LET b6944 == [a |-> IF FALSE THEN 2147483647 ELSE 1, b |-> (\A b6945 \in [a |-> 1] : FALSE)] IN ((CHOOSE r \in [a : {1, 2}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 55 of module random_04412
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 97 of module random_04412
    | <<>>
---*)
