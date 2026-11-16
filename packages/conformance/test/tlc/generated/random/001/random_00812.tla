(*---
description: Evaluates a random set expression, seed 262, number 812.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00812 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({CASE LET b1329 == 2147483647 IN -1 -> Cardinality({1, 2}) [] OTHER -> Tail(<<1>>) : b1328 \in {Len(<<3, 1, 2>>) : b1330 \in {-1, 3}}} \ {Head(SubSeq(<<>>, -1, 3)), Len((<<5, 6>> @@ <<5, 6>>))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00812 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 23 to line 14, col 51 of module random_00812
---*)
