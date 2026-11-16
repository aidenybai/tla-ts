(*---
description: Evaluates a random seq expression, seed 262, number 2798.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02798 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b4435 \in ((1..3 \cap 1..3) \ DOMAIN [x \in Nat |-> x + 1]) : (~({1} \subseteq SUBSET {1}))) \o SubSeq(Tail(SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), ((7 - 7) + Len(<<3, 1, 2>>)), ((CHOOSE r \in [a : {1, 2}] : TRUE) % (CHOOSE b4436 \in <<>> : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02798 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 115 of module random_02798
---*)
