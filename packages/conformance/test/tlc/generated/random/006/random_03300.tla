(*---
description: Evaluates a random record expression, seed 262, number 3300.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03300 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((-1 \div 0))[CASE FALSE -> 7 [] OTHER -> 7], b |-> ((\E b5248 \in {1} : FALSE) <=> (TRUE \/ FALSE))] EXCEPT !.a = @ + (CHOOSE b5249 \in {b5250 \in UNION {{1, 2}, 2..1} : ({2, 1, 3} = {x \in 1..3 : x > 1})} : ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [[a |-> 1] EXCEPT !.a = 1]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03300 failed.
    2179:0 The second argument of \div is 0.
---*)
