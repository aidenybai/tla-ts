(*---
description: Evaluates a random int expression, seed 262, number 9741.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09741 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b15123 \in UNION {{b15124 \in {2147483647, 7} : (FALSE /\ FALSE)}, (({} \ {1}) \ {1, -1})} : ((\E b15125 \in ([a |-> 1] \cap {2, 1, 3}) : (TRUE => TRUE)) \/ (\A b15126 \in UNION {{2, 1, 3}, Nat} : (FALSE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09741 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 237 of module random_09741
---*)
