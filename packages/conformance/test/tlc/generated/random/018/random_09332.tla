(*---
description: Evaluates a random set expression, seed 262, number 9332.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09332 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [(1 :> 2) EXCEPT ![1] = 7] \cap {(<<1>> \o <<>>) : b14477 \in UNION {{1}, SUBSET {1}}}) \cap (UNION {({1} \cap SUBSET {1}), (Nat \cup SUBSET {1})} \cap {(CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE) : b14478 \in ({} \cap {x \in 1..3 : x > 1})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09332 failed.
    Attempted to compare the set {} with the value:
    1
---*)
