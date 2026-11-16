(*---
description: Evaluates a random function expression, seed 262, number 7230.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07230 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b11107 \in Nat : TRUE) % Head(<<>>)) :> CASE (1 = 7) -> (2 * [x \in Nat |-> x + 1]) [] OTHER -> IF TRUE THEN 0 ELSE 2) @@ (Cardinality(SubSeq(<<3, 1, 2>>, 2147483647, 1)) :> (CHOOSE b11108 \in ({} \cup {1}) : (FALSE <=> TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07230 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 20 to line 14, col 47 of module random_07230
---*)
