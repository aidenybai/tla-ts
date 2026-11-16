(*---
description: Evaluates a random bool expression, seed 262, number 1295.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01295 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b2062 \in (CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE) : (([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b2062] = [[a |-> 1] EXCEPT !.a = -1]) /\ (\A b2063 \in ({1, 2} \cap 1..3) : (b2063 < b2062)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01295 failed.
    TLC encountered a non-enumerable quantifier bound
    <<2>>.
    line 14, col 31 to line 14, col 71 of module random_01295
---*)
