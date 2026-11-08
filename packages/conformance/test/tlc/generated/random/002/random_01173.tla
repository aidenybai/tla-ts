(*---
description: Evaluates a random record expression, seed 262, number 1173.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01173 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((\E b1879 \in 1..3 : FALSE) \o Append(<<3, 1, 2>>, -1)) EXCEPT !.a = @ + (([x \in 1..2 |-> x] :> 7))[Head(<<1>>)]] EXCEPT !.a = @ + (Cardinality(DOMAIN (1 :> 2)) \div ([<<1>> EXCEPT ![1] = 2147483647] \div (CHOOSE b1880 \in {2, 1, 3} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01173 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    FALSE
---*)
