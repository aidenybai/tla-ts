(*---
description: Evaluates a random bool expression, seed 262, number 2442.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02442 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((UNION {SUBSET {1}, {1, 2}} \cap ({1, 2} \cup {x \in 1..3 : x > 1})) \ DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {2, 1, 3}] : TRUE)) = {b3855 \in (Len(<<3, 1, 2>>) .. LET b3856 == 0 IN 1) : (CASE FALSE -> b3855 [] OTHER -> b3855 \in (SUBSET {1} \ {1}))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02442 failed.
    Attempted to compare integer 1 with non-integer:
    {}
---*)
