(*---
description: Evaluates a random bool expression, seed 262, number 9551.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09551 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b14833 \in (Nat \cup {}) : SelectSeq(<<1>>, LAMBDA e : e > 0)) - ([a |-> 1, b |-> FALSE]).a) = [a |-> ((Nat \ {2, 1, 3}) @@ [(1 :> 2) EXCEPT ![2] = [a |-> 1, b |-> TRUE]]), b |-> (\A b14834 \in ({} \cup Nat) : (\E b14835 \in {} : TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09551 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 19 to line 14, col 86 of module random_09551
---*)
