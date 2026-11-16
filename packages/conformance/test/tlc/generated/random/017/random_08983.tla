(*---
description: Evaluates a random function expression, seed 262, number 8983.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08983 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b13943 \in (CHOOSE r \in [a : {}] : TRUE) |-> ((\A b13944 \in {2, 1, 3} : <<1, 2>>) + LET b13945 == 2 IN 2)] @@ (CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08983 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 30 to line 14, col 57 of module random_08983
---*)
