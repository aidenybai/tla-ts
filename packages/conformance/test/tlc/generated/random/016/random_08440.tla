(*---
description: Evaluates a random record expression, seed 262, number 8440.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08440 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> CASE ((FALSE => FALSE) \/ (2147483647 < 7)) -> (LET b13063 == 1 IN b13063 % Head(<<>>)) [] OTHER -> (CHOOSE b13064 \in DOMAIN <<>> : (TRUE <=> FALSE)), b |-> ([<<1, -1>> EXCEPT ![1] = LET b13065 == 1 IN b13065] = (CHOOSE f \in [{1, 2} -> {2, 1, 3}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08440 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
