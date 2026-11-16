(*---
description: Evaluates a random int expression, seed 262, number 7895.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07895 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (Append(<<2147483647, 3>>, (\A b12187 \in 2..1 : FALSE)) = (CHOOSE b12188 \in ({} \cap {1, 2}) : (<<>> = (1 :> 2)))) THEN (CHOOSE f \in [1..2 -> {0} \cup {1}] : TRUE) ELSE IF (\E b12189 \in ({x \in 1..3 : x > 1} \ SUBSET {1}) : (b12189 \in 1..3)) THEN IF (2 < 1) THEN (2147483647 \div 0) ELSE (3 + 7) ELSE ({b12190 \in {1} : FALSE} \subseteq DOMAIN [x \in 1..2 |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07895 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 79 to line 14, col 132 of module random_07895
---*)
