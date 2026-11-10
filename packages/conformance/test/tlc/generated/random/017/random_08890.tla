(*---
description: Evaluates a random function expression, seed 262, number 8890.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08890 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF [[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] THEN (-(1 :> 2)) ELSE ([a |-> 1]).a + Len(Append(<<1>>, 3))) = (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08890 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 18 to line 14, col 118 of module random_08890
---*)
