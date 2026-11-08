(*---
description: Evaluates a random seq expression, seed 262, number 613.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00613 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq((SelectSeq(<<>>, LAMBDA e : e > 0) \o [<<>> EXCEPT ![1] = -1]), ((3 + 3) * (1 % -1)), (CHOOSE b1026 \in (<<5, 6>> @@ [x \in Nat |-> x + 1]) : ([a |-> 1] = [a |-> 1]))), ({IF FALSE THEN 3 ELSE 0 : b1027 \in {2147483647, 3}} \subseteq {b1028 \in (-1 - -1) : (FALSE = [a |-> 1, b |-> TRUE])})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 69 to line 14, col 72 of module random_00613
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00613 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
