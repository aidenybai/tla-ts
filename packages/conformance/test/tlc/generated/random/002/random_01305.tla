(*---
description: Evaluates a random function expression, seed 262, number 1305.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01305 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q)) :> (CHOOSE b2068 \in {b2069 \in ({1, 2} \cap {x \in 1..3 : x > 1}) : ({x \in 1..3 : x > 1} = {x \in 1..3 : x > 1})} : [[b2070 \in 2..1 |-> b2070] EXCEPT ![Append(<<>>, -1)] = (b2068 + b2068)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01305 failed.
    Attempted to apply function with integer domain to the non-integer argument <<-1>>
---*)
