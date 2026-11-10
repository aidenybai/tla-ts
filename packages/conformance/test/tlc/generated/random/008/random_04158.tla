(*---
description: Evaluates a random int expression, seed 262, number 4158.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04158 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b6545 == ((CASE FALSE -> 1 [] OTHER -> 0 - ([a |-> 1, b |-> TRUE]).a) \div Cardinality(DOMAIN [x \in 1..2 |-> x])) IN (CHOOSE b6546 \in (((1 :> 2))[0] .. (0 - 2)) : ((SUBSET {1} \cup {1, 2}) \subseteq (<<3, 1, 2>> \cap {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04158 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
