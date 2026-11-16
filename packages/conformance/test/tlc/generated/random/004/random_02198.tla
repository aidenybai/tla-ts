(*---
description: Evaluates a random record expression, seed 262, number 2198.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02198 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = @ + ([b3455 \in {b3456 \in SUBSET {1} : FALSE} |-> (b3455 * b3455)] + CASE ({} = TRUE) -> (1 - 3) [] OTHER -> (-1 % 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02198 failed.
    Attempted to check equality of the set {} with the value:
    TRUE
---*)
