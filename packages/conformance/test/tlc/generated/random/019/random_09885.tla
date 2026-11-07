(*---
description: Evaluates a random bool expression, seed 262, number 9885.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09885 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b15365 \in DOMAIN (2147483647 @@ <<5, 6>>) : ((\A b15366 \in 1..3 : FALSE) <=> [[a |-> 1] EXCEPT !.a = @ + b15365])) <=> (Head((<<1, 2>> \o <<>>)) = ((CHOOSE b15367 \in 2..1 : FALSE) * Len(<<1>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    2147483647
    2169:0 The first argument of @@ should be a function, but instead it is:
    2147483647
---*)
