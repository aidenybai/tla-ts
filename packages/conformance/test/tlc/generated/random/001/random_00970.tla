(*---
description: Evaluates a random int expression, seed 262, number 970.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00970 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (DOMAIN (2 :> 7) \subseteq ({b1563 : b1563 \in {1, 2}} \cap DOMAIN [a |-> 1])) THEN (((CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE) @@ (FALSE :> 0)))[([a |-> FALSE, b |-> <<1, 2>>]).a] ELSE ([[b1564 \in {x \in 1..3 : x > 1} |-> b1564] EXCEPT ![(-1 - -1)] = (2147483647)[2147483647]])[([b1565 \in {2, 1, 3} |-> b1565])[LET b1566 == 7 IN 7]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00970 failed.
    Attempted to check equality of string "a" with non-string:
    1
---*)
