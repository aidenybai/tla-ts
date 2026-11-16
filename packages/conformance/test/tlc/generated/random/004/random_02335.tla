(*---
description: Evaluates a random set expression, seed 262, number 2335.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02335 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b3698 \in ((SUBSET {1} \cap SUBSET {1}) \ {0 : b3699 \in {}}) : ((TRUE <=> TRUE) \/ (b3698 :> b3698))} \ ({b3700 \in UNION {SUBSET {1}, {2, 1, 3}} : (0 = 0)} \cap DOMAIN [b3701 \in {x \in 1..3 : x > 1} |-> b3701])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02335 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
