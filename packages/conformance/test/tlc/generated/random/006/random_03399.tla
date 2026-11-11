(*---
description: Evaluates a random seq expression, seed 262, number 3399.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03399 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq(((-0) .. IF TRUE THEN 3 ELSE 0), ((CHOOSE b5397 \in Nat : TRUE) - (2147483647 + 0)), CASE (SUBSET {1} \subseteq {1, 2}) -> IF FALSE THEN -1 ELSE -1 [] OTHER -> ([a |-> 1]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03399 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 63 to line 14, col 89 of module random_03399
---*)
