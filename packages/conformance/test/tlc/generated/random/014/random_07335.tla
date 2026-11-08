(*---
description: Evaluates a random record expression, seed 262, number 7335.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07335 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + (7 \div 7)] EXCEPT !.a = @ + ((CHOOSE b11287 \in {1, 2} : TRUE) * Head(<<1>>))] EXCEPT !.a = ((({} \cap 2..1) \cap {b11288 : b11288 \in 1..3}) \ {(0 \div 0), ({1} = 2..1)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07335 failed.
    2179:0 The second argument of \div is 0.
---*)
