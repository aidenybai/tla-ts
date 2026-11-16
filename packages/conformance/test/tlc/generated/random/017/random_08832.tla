(*---
description: Evaluates a random seq expression, seed 262, number 8832.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08832 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([SortSeq(<<1>>, LAMBDA p, q : p < q) EXCEPT ![1] = CASE TRUE -> 2147483647 [] OTHER -> 0] \o <<((1 :> 2))[-1], (-2147483647)>>) \o Append(SortSeq([<<>> EXCEPT ![1] = 3], LAMBDA p, q : p < q), ([[x \in Nat |-> x + 1] EXCEPT ![1] = 1])[(CHOOSE b13679 \in 2..1 : FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08832 failed.
    Attempted to apply function:
    <<2>>
    to argument -1, which is not in the domain of the function.
---*)
