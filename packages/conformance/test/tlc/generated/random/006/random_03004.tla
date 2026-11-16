(*---
description: Evaluates a random function expression, seed 262, number 3004.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03004 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (UNION {{x \in 1..3 : x > 1}, {1, 2}} = (3 .. 7)) THEN IF ({} = 2..1) THEN (3 + 2) ELSE (2 + 0) ELSE ((0 \div 7) \div CASE FALSE -> 2147483647 [] OTHER -> 3) :> Len(Append([<<>> EXCEPT ![1] = 2], Head([x \in 1..2 |-> x])))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 193 to line 14, col 196 of module random_03004
    | (0 :> 1)
---*)
