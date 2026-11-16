(*---
description: Evaluates a random function expression, seed 262, number 7641.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07641 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{0} \cup {1} -> {}] : TRUE) EXCEPT ![Cardinality((Nat \ {1, 2}))] = (CHOOSE b11756 \in DOMAIN (1 :> 2) : (<<3, 1, 2>> = <<5, 6>>))] EXCEPT ![(CHOOSE b11757 \in ({b11758 \in {1, 2} : FALSE} \cap {b11759 : b11759 \in {2, 1, 3}}) : ([a |-> 0, b |-> TRUE] = [a |-> 3, b |-> TRUE]))] = (((0 * 3) + (2 + {1, 2})) - LET b11760 == (1 % 0) IN LET b11761 == 3 IN -1)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07641 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 58 of module random_07641
---*)
