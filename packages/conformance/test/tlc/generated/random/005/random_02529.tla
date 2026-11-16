(*---
description: Evaluates a random seq expression, seed 262, number 2529.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02529 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b3988 \in {b3989 \in ({-1, 2} \ {b3990 \in {1} : TRUE}) : (\A b3991 \in ({} \ {2, 1, 3}) : (<<>> = (1 :> 2)))} : {(([a |-> 1]).a % IF TRUE THEN b3992 ELSE 0) : b3992 \in (DOMAIN <<5, 6>> \cup (SUBSET {1} \cup 1..3))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02529 failed.
    Attempted to compare the set {} with the value:
    2
---*)
