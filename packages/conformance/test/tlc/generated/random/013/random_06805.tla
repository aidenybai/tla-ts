(*---
description: Evaluates a random record expression, seed 262, number 6805.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06805 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([UNION {{(-2), ([a |-> 1, b |-> TRUE]).a}, {(CHOOSE b10437 \in {1, 2} : TRUE) : b10436 \in UNION {SUBSET {1}, <<1, 2>>}}} EXCEPT !.a = @ + (IF (2 < 3) THEN (SUBSET {1} \ {1}) ELSE (-1 + 2) - (-(7 * 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06805 failed.
    Attempted to compare the function <<1, 2>> with the value:
    {{}, {1}}
---*)
