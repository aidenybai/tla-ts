(*---
description: Evaluates a random function expression, seed 262, number 2970.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02970 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} -> 1..2] : TRUE) EXCEPT ![([a |-> (2147483647 - 2147483647), b |-> (TRUE <=> TRUE)]).a] = CASE (\E b4713 \in ([a |-> 1] \cup <<1, 2>>) : (1 = -1)) -> (CHOOSE b4714 \in {2, -1} : (1 \in Nat)) [] OTHER -> Head(SubSeq(<<>>, 7, 1))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 53 of module random_02970
    | <<1, 1>>
---*)
