(*---
description: Evaluates a random function expression, seed 262, number 4213.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04213 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (-1 < 3) -> (1 * 7) [] OTHER -> IF TRUE THEN 7 ELSE 2147483647 :> (-LET b6624 == 2 IN 7)) @@ [b6625 \in (Head(<<3, 1, 2>>) .. ([x \in Nat |-> x + 1])[2147483647]) |-> (Len(<<>>) * (-2147483647))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04213 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
