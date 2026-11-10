(*---
description: Evaluates a random bool expression, seed 262, number 4740.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04740 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~({2, 1, 3} /\ FALSE)) => (({2, 1, 3} \ 2147483647) \subseteq ({1, 2} \cap {x \in 1..3 : x > 1}))) \/ (((SUBSET {1} \cap {2, 1, 3}) \cap ([a |-> 1, b |-> TRUE] .. 3)) = DOMAIN (CHOOSE f \in [{1, 2} \ {1} -> 1..2] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04740 failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a set of the form {e1, ... ,eN}.
    line 14, col 21 to line 14, col 38 of module random_04740
---*)
