(*---
description: Evaluates a random bool expression, seed 262, number 7909.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07909 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b12200 \in UNION {{[a |-> 2147483647, b |-> (1 :> 2)] : b12201 \in ((1 :> 2))[3]}, ([[x \in Nat |-> x + 1] EXCEPT ![3] = 0] \cup (1..3 \cap 1..3))} : ((Len(<<>>) = Len(<<>>)) => (SortSeq(<<1>>, LAMBDA p, q : p < q) = ([x \in 1..2 |-> x] @@ <<5, 6>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07909 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
