(*---
description: Evaluates a random seq expression, seed 262, number 360.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00360 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(SubSeq(<<2147483647, 2>>, ([a |-> 1, b |-> TRUE]).a, [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]), LAMBDA e : e > 0), (CASE (<<>> /\ [x \in Nat |-> x + 1]) -> (-1 \div 7) [] OTHER -> (CHOOSE f \in [{1} -> 1..2] : TRUE) % ((-2147483647) * (0 * 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00360 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    [a |-> 2, b |-> TRUE]
---*)
