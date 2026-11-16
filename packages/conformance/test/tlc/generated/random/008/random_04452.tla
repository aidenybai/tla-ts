(*---
description: Evaluates a random set expression, seed 262, number 4452.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04452 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality((CASE FALSE -> b7009 [] OTHER -> 1 .. CASE TRUE -> 2 [] OTHER -> -1)) : b7009 \in ((\E b7010 \in (SUBSET {1} \ {}) : (FALSE => FALSE)) \cup (({1, 2} \cap {}) \cup {b7011 \in {x \in 1..3 : x > 1} : TRUE}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04452 failed.
    Attempted to enumerate S \cup T when S:
    {2, 3}
    and T:
    TRUE
    are not both enumerable
---*)
