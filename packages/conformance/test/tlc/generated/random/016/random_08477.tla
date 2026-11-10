(*---
description: Evaluates a random bool expression, seed 262, number 8477.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08477 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b13116 \in SUBSET {1} : TRUE} \cap {b13117 : b13117 \in {x \in 1..3 : x > 1}}) \cup ({2 : b13118 \in {x \in 1..3 : x > 1}} \ {b13119 \in SUBSET {1} : TRUE})) \subseteq (((SUBSET {1} \cap {x \in 1..3 : x > 1}) \ {b13120 : b13120 \in 2..1}) \cap ((0 + 0) .. LET b13121 == -1 IN 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08477 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
