(*---
description: Evaluates a random function expression, seed 262, number 3556.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03556 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b5624 \in (DOMAIN [a |-> 1] \cap ({1, 2} \cap {})) |-> CASE (\E b5625 \in {1} : FALSE) -> [a |-> b5624, b |-> TRUE] [] OTHER -> (<<5, 6>>)[b5624]] @@ (CHOOSE f \in [{0} \cup {1} -> 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03556 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 169 to line 14, col 210 of module random_03556
---*)
