(*---
description: Evaluates a random function expression, seed 262, number 4211.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04211 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len({b6621 \in {0, 2} : (<<1>> = [x \in 1..2 |-> x])}) :> (Len(Append(<<3, 1, 2>>, 0)) % (([x \in 1..2 |-> x] @@ <<5, 6>>))[CASE TRUE -> -1 [] OTHER -> 2147483647])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    {}
    2283:0 The argument of Len should be a sequence, but instead it is:
    {}
---*)
