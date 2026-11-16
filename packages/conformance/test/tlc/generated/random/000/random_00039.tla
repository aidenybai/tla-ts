(*---
description: Evaluates a random seq expression, seed 262, number 39.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00039 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((2 /\ FALSE) /\ (~FALSE)) \/ ((<<5, 6>>)[-1] = CASE FALSE -> 2147483647 [] OTHER -> 1)) EXCEPT ![1] = (([b57 \in SUBSET {1} |-> b57] @@ [[x \in 1..2 |-> x] EXCEPT ![2147483647] = 2]))[(CHOOSE b58 \in DOMAIN [x \in 1..2 |-> x] : (1..3 \subseteq {2, 1, 3}))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00039 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    an integer.
    line 14, col 20 to line 14, col 29 of module random_00039
---*)
