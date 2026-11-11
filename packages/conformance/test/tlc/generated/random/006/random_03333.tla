(*---
description: Evaluates a random set expression, seed 262, number 3333.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03333 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len((2 = 2147483647)) .. LET b5296 == IF TRUE THEN 7 ELSE 2147483647 IN ([a |-> 1]).a) \cap (DOMAIN (CHOOSE f \in [2..1 -> {0} \cup {1}] : TRUE) \cap UNION {(SUBSET {1} \cup {}), [b5297 \in {1, 2} |-> b5297]})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03333 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    FALSE
---*)
