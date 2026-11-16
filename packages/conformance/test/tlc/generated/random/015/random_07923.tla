(*---
description: Evaluates a random bool expression, seed 262, number 7923.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07923 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b12228 \in {b12229 \in (Tail(<<1>>) \o SortSeq(<<>>, LAMBDA p, q : p < q)) : (\E b12230 \in {FALSE : b12231 \in 2..1} : (\E b12232 \in {} : FALSE))} : (SelectSeq(SortSeq([x \in Nat |-> x + 1], LAMBDA p, q : p < q), LAMBDA e : e > 0) = (CHOOSE f \in [{1, 2} -> 1..2] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07923 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    <<>>
    is not enumerable
---*)
