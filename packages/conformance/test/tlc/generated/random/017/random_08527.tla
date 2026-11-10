(*---
description: Evaluates a random set expression, seed 262, number 8527.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08527 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{b13212 \in (1..3 \cup 1..3) : (TRUE \/ FALSE)}, {b13213 \in (TRUE /\ [x \in 1..2 |-> x]) : ({1} = 2..1)}} \cap Tail(Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LET b13214 == -1 IN 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08527 failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a function  of the form (d1 :> e1 @@ ... @@ dN :> eN).
    line 14, col 86 to line 14, col 111 of module random_08527
---*)
