(*---
description: Evaluates a random seq expression, seed 262, number 7322.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07322 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(((-(2147483647 \div 1)) \o SortSeq(Append(<<>>, -1), LAMBDA p, q : p < q)), (((2147483647 :> -1) @@ [[x \in Nat |-> x + 1] EXCEPT ![1] = 0]))[CASE (0 = -1) -> CASE TRUE -> 1 [] OTHER -> 2 [] OTHER -> (0).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07322 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    -2147483647
---*)
