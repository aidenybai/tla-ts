(*---
description: Evaluates a random seq expression, seed 262, number 6825.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06825 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<IF Append(<<1>>, 2147483647) THEN ((1 :> 2))[2] ELSE Len(<<>>), Len(<<7, -1>>)>> EXCEPT ![1] = IF (Cardinality(SUBSET {1}) < Cardinality(1..3)) THEN ((-1 % 2) * (-1 % 2)) ELSE Head(SelectSeq(<<1>>, LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06825 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 19 to line 14, col 80 of module random_06825
---*)
