(*---
description: Evaluates a random int expression, seed 262, number 3379.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03379 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((-1 \div 0) % (CHOOSE b5359 \in {} : FALSE)) < LET b5360 == (-1 \div 2) IN (b5360 - <<>>)) -> LET b5361 == ((2147483647 \div 2) + (CHOOSE b5362 \in {} : TRUE)) IN [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = (3 * b5361)] [] OTHER -> ((CHOOSE b5363 \in DOMAIN [x \in Nat |-> x + 1] : (\A b5364 \in 1..3 : TRUE)) * [(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = ((1 :> 2))[2]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03379 failed.
    2179:0 The second argument of \div is 0.
---*)
