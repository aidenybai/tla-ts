(*---
description: Evaluates a random seq expression, seed 262, number 7983.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07983 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SubSeq(((0 .. 7) \subseteq {b12331 \in 2..1 : TRUE}), Head((<<1, 2>> \o <<1, 2>>)), IF [a |-> 2147483647, b |-> FALSE] THEN (3 \div 3) ELSE Head(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07983 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 105 to line 14, col 177 of module random_07983
---*)
