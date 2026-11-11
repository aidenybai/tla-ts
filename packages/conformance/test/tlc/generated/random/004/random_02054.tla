(*---
description: Evaluates a random int expression, seed 262, number 2054.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02054 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (\E b3262 \in DOMAIN [x \in 1..2 |-> x] : ({} = TRUE)) -> {Len(<<3, 1, 2>>) : b3263 \in (-1 .. -1)} [] OTHER -> [[a |-> -1, b |-> TRUE] EXCEPT !.a = @ + LET b3264 == 0 IN b3264] \div ([a |-> (-1 - -1), b |-> ([a |-> 1] \subseteq SUBSET {1})] - ((2147483647 + -1) % (0 \div 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02054 failed.
    Attempted to check equality of the set {} with the value:
    TRUE
---*)
