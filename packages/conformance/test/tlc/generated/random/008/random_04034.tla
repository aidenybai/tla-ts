(*---
description: Evaluates a random int expression, seed 262, number 4034.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04034 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b6344 == CASE (Tail(FALSE) = (<<5, 6>> @@ <<5, 6>>)) -> SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q) [] OTHER -> Len(Append(<<3, 1, 2>>, 2147483647)) IN CASE (\A b6345 \in (b6344 .. 0) : (Nat = {1, 2})) -> (([x \in Nat |-> x + 1])[-1] - (b6344 \div 2)) [] OTHER -> ((3 % 3) * ([a |-> 1]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Tail should be a sequence, but instead it is:
    FALSE
---*)
