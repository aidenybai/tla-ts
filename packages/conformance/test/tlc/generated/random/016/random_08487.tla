(*---
description: Evaluates a random bool expression, seed 262, number 8487.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08487 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b13136 \in {b13137 \in UNION {{b13138 \in FALSE : TRUE}, {b13139 \in {2, 1, 3} : FALSE}} : (SelectSeq(<<>>, LAMBDA e : e > 0) = [[x \in 1..2 |-> x] EXCEPT ![3] = 0])} : (~(\E b13140 \in Tail(<<1, 2>>) : (FALSE /\ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08487 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    FALSE
    is not enumerable
---*)
