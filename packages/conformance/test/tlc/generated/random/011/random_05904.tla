(*---
description: Evaluates a random seq expression, seed 262, number 5904.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05904 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SelectSeq(SubSeq(Tail(<<1>>), Head(<<3, 1, 2>>), Head(<<1>>)), LAMBDA e : e > 0), Head(SubSeq([<<3, 1, 2>> EXCEPT ![1] = -1], CASE <<1, 2>> -> 2 [] OTHER -> 1, SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))), ([(CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![(2 \div 0)] = (7 \div 1)])[IF (FALSE \/ FALSE) THEN (0 + 7) ELSE (2147483647 % 0)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05904 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 154 to line 14, col 161 of module random_05904
---*)
