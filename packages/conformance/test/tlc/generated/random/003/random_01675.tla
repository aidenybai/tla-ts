(*---
description: Evaluates a random function expression, seed 262, number 1675.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01675 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((FALSE \subseteq {1, 2}) => (3 \in 2..1)) THEN (IF FALSE THEN (1 :> 2) ELSE 7 * (7 % 3)) ELSE (Head(<<1>>) - IF FALSE THEN 3 ELSE 2147483647) :> ([([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) EXCEPT ![(2 \div 2)] = (FALSE <=> TRUE)])[((<<5, 6>> @@ 0))[Head(<<1, 2>>)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01675 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 22 to line 14, col 43 of module random_01675
---*)
