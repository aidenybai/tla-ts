(*---
description: Evaluates a random function expression, seed 262, number 9833.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09833 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b15265 \in ((2..1 \cap {1, 2}) \cup {b15266 \in {2, 1, 3} : FALSE}) : (\A b15267 \in {b15265, 7} : (TRUE /\ TRUE))) :> (((2147483647 * 7) \div CASE FALSE -> 3 [] OTHER -> 1) :> CASE (TRUE \/ TRUE) -> LET b15268 == [a |-> 1] IN -1 [] OTHER -> (2147483647 \in 2..1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09833 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 138 of module random_09833
---*)
