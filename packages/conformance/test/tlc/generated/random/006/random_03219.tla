(*---
description: Evaluates a random set expression, seed 262, number 3219.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03219 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [(-1 :> 2) EXCEPT ![CASE TRUE -> 0 [] OTHER -> 3] = IF FALSE THEN 2 ELSE 2147483647] \cup ((([x \in 1..2 |-> x])[1] .. (CHOOSE b5111 \in {1} : <<1>>)) \ {LET b5112 == [a |-> 1] IN 3, (CHOOSE b5113 \in SUBSET {1} : TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 32 of module random_03219
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03219 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 144 to line 14, col 171 of module random_03219
---*)
