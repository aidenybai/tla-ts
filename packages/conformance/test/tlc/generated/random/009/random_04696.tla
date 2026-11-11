(*---
description: Evaluates a random set expression, seed 262, number 4696.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04696 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{b7345 \in (DOMAIN [x \in 1..2 |-> x] \cap (SUBSET {1} \cup {})) : ((0 - 0) < IF TRUE THEN -1 ELSE b7345)}, (Len((<<>> \o <<1, 2>>)) .. Cardinality({b7346 \in {x \in 1..3 : x > 1} : TRUE}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04696 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
