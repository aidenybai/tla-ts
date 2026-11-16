(*---
description: Evaluates a random function expression, seed 262, number 2686.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02686 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[b4248 \in (1..3 \cup Nat) |-> CASE FALSE -> 7 [] OTHER -> 2147483647] EXCEPT ![(-(CHOOSE b4249 \in {} : TRUE))] = ((-7) \div Cardinality(SUBSET {1}))] @@ (CHOOSE f \in [2..1 -> {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02686 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 101 to line 14, col 126 of module random_02686
---*)
