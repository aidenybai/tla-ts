(*---
description: Evaluates a random seq expression, seed 262, number 4953.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04953 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(Append(SubSeq(<<3, 1, 2>>, 1, [x \in Nat |-> x + 1]), (-0)), LAMBDA p, q : p < q), (CHOOSE b7707 \in (CHOOSE r \in [a : {2, 1, 3}] : TRUE) : (CASE FALSE -> b7707 [] OTHER -> 2147483647 < (b7707)[2]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    [x \in Nat |-> <expression line 14, col 76 to line 14, col 80 of module random_04953>]
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    [x \in Nat |-> <expression line 14, col 76 to line 14, col 80 of module random_04953>]
---*)
