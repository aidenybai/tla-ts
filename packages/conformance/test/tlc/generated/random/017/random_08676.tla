(*---
description: Evaluates a random function expression, seed 262, number 8676.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08676 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b13426 \in ((CHOOSE b13427 \in <<5, 6>> : FALSE) .. (0 + 0)) |-> ((CHOOSE r \in [a : 1..2] : TRUE)).a] EXCEPT ![((Tail(<<>>) - (-1 % [x \in 1..2 |-> x])) - CASE (<<>> = [x \in Nat |-> x + 1]) -> {b13428 \in {} : FALSE} [] OTHER -> (-0))] = (-Len(SelectSeq(<<1>>, LAMBDA e : e > 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08676 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 31 to line 14, col 64 of module random_08676
---*)
