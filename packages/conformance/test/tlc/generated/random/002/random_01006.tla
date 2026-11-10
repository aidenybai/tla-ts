(*---
description: Evaluates a random bool expression, seed 262, number 1006.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01006 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {{b1615 \in Nat : TRUE}, (Nat \cap {1})} \cap {b1616 \in DOMAIN [x \in Nat |-> x + 1] : (\E b1617 \in SUBSET {1} : FALSE)}) = UNION {{b1618 \in (Nat \ {x \in 1..3 : x > 1}) : ([x \in 1..2 |-> x] \cap SUBSET {1})}, ({3, 1} \cap {b1619 \in Nat : <<5, 6>>})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01006 failed.
    The evaluation of predicate line 14, col 268 to line 14, col 275 of module random_01006 yielded non-Boolean value.
---*)
