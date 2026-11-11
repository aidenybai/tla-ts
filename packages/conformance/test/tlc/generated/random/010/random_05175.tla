(*---
description: Evaluates a random int expression, seed 262, number 5175.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05175 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Append(Append(<<1, 2>>, 0), Len(<<>>))) - (((CHOOSE f \in [1..2 -> 1..2] : TRUE) @@ (<<5, 6>> @@ <<5, 6>>)))[((CHOOSE b8028 \in Nat : TRUE) % CASE TRUE -> 7 [] OTHER -> Nat)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05175 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 133 to line 14, col 159 of module random_05175
---*)
