(*---
description: Evaluates a random seq expression, seed 262, number 4917.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04917 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(<<([a |-> 1, b |-> TRUE]).a, (3 % 7)>>, (-IF 7 THEN 2147483647 ELSE 7), (CASE TRUE -> 0 [] OTHER -> 0 + (3 % 3))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04917 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 73 to line 14, col 99 of module random_04917
---*)
