(*---
description: Evaluates a random bool expression, seed 262, number 7704.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07704 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b11875 \in {(CHOOSE b11877 \in {b11876 : b11878 \in [a |-> 1, b |-> TRUE]} : (3 < b11877)) : b11876 \in UNION {(2 .. 1), {b11879 : b11879 \in 1..3}}} : (\E b11880 \in DOMAIN (3 :> 1) : ([[a |-> 1] EXCEPT !.a = @ + b11875] = (CHOOSE r \in [a : 1..2] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07704 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1, b |-> TRUE].
    line 14, col 72 to line 14, col 92 of module random_07704
---*)
