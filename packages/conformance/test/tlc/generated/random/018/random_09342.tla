(*---
description: Evaluates a random set expression, seed 262, number 9342.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09342 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({(CHOOSE b14495 \in {1, 2} : [a |-> 1, b |-> TRUE]) : b14494 \in UNION {1..3, 1..3}} \ DOMAIN [b14496 \in 2..1 |-> b14496]), {b14497 \in (UNION {{2, 1, 3}, Nat} \ UNION {{x \in 1..3 : x > 1}, {2, 1, 3}}) : ([FALSE EXCEPT !.a = [a |-> 1]] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 26 to line 14, col 73 of module random_09342
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 26 to line 14, col 73 of module random_09342
---*)
