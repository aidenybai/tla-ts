(*---
description: Evaluates a random record expression, seed 262, number 7596.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07596 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Len((~FALSE)), b |-> (Cardinality(1..3) \in UNION {{1}, {x \in 1..3 : x > 1}})] EXCEPT !.a = @ + ([b11687 \in UNION {2..1, {x \in 1..3 : x > 1}} |-> (3 * b11687)])[({b11688 : b11688 \in {}} + DOMAIN (1 :> 2))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07596 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)
