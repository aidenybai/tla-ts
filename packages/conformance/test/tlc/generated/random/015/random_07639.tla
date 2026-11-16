(*---
description: Evaluates a random bool expression, seed 262, number 7639.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07639 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(Tail(SelectSeq(<<1>>, LAMBDA e : e > 0)), LET b11753 == (CHOOSE b11754 \in 2..1 : [a |-> 1, b |-> TRUE]) IN (2147483647 % 7), ((CHOOSE b11755 \in Nat : FALSE) % CASE FALSE -> 7 [] OTHER -> -1)) = [((1 :> 2) @@ ([x \in 1..2 |-> x] @@ (1 :> 2))) EXCEPT ![([a |-> 2147483647, b |-> TRUE]).a] = (((1 :> 2) @@ <<5, 6>>))[Len(<<1>>)]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07639 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 152 to line 14, col 180 of module random_07639
---*)
