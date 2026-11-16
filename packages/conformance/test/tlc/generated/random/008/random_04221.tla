(*---
description: Evaluates a random set expression, seed 262, number 4221.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04221 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b6632 \in (([a |-> 1])[1] .. (2147483647 + 3)) : (Tail(<<>>) = ((1 :> 2) @@ (1 :> 2)))) .. LET b6633 == ((-1 \div 3) - CASE TRUE -> 2147483647 [] OTHER -> 3) IN Head([a |-> 7, b |-> TRUE])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04221 failed.
    Attempted to access record by a non-string argument: 1
---*)
