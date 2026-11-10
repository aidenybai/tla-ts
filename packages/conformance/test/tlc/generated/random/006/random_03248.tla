(*---
description: Evaluates a random function expression, seed 262, number 3248.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03248 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) @@ ((1 :> 2) @@ <<5, 6>>)) @@ [b5165 \in {2, 2} |-> (CHOOSE b5166 \in Nat : TRUE)]) @@ (LET b5167 == CASE FALSE -> <<3, 1, 2>> [] OTHER -> {} IN Tail(<<>>) :> (CASE FALSE -> 2147483647 [] OTHER -> -1 \div (7 \div 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03248 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 115 to line 14, col 141 of module random_03248
---*)
