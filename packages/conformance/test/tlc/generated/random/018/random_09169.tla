(*---
description: Evaluates a random record expression, seed 262, number 9169.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09169 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(([a |-> 1] = [a |-> 1]) <=> ([a |-> 1, b |-> TRUE] = [a |-> 1])) EXCEPT !.a = (CHOOSE b14236 \in DOMAIN (1 :> 2) : ({1} \subseteq {1}))] EXCEPT !.a = ((Len(<<>>) \div LET b14237 == 2147483647 IN 0) + ([a |-> 7, b |-> FALSE]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09169 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
