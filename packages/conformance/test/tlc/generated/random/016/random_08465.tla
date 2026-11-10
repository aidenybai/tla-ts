(*---
description: Evaluates a random set expression, seed 262, number 8465.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08465 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(CHOOSE b13098 \in {b13099 \in 2..1 : [a |-> 1, b |-> TRUE]} : (b13098 = b13098)), ((1..3)[1] * ((1 :> 2))[7])} \cap Tail((SubSeq(<<1>>, 2147483647, 2) \o Tail(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08465 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 97 of module random_08465
---*)
