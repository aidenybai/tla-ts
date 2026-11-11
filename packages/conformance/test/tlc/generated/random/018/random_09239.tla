(*---
description: Evaluates a random seq expression, seed 262, number 9239.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09239 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Append(Append(<<1>>, 7), LET b14339 == <<5, 6>> IN b14339)) \o [<<(3 \div 0), (3 \div 3)>> EXCEPT ![1] = (([x \in 1..2 |-> x] % 2) \div (Nat)[FALSE])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09239 failed.
    2179:0 The second argument of \div is 0.
---*)
