(*---
description: Evaluates a random seq expression, seed 262, number 6781.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06781 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<Len([b10398 \in 2..1 |-> b10398]), ([a |-> 0, b |-> TRUE]).a>> EXCEPT ![1] = (CHOOSE b10399 \in {LET b10400 == 0 IN FALSE, IF TRUE THEN 1 ELSE 0} : (~(TRUE <=> TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06781 failed.
    Attempted to compare integer 1 with non-integer:
    FALSE
---*)
