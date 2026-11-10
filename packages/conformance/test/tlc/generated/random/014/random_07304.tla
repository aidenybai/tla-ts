(*---
description: Evaluates a random seq expression, seed 262, number 7304.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07304 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(((~(<<3, 1, 2>> = [x \in Nat |-> x + 1])) \o (SelectSeq(<<>>, LAMBDA e : e > 0) \o SubSeq(<<1, 2>>, 7, -1))), IF (Cardinality(2..1) < (3 \div 2)) THEN IF (\A b11254 \in Nat : FALSE) THEN ((1 :> 2))[2147483647] ELSE (7 + 7) ELSE Len(SelectSeq(<<>>, LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07304 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
