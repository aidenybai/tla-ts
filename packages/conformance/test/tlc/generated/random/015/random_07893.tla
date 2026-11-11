(*---
description: Evaluates a random function expression, seed 262, number 7893.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07893 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b12183 \in {b12184 \in (1..3 \cap {1, 2}) : (2..1 \subseteq {1})} |-> ((-b12183) + Cardinality(SUBSET {1}))] EXCEPT ![Cardinality([b12185 \in {0, 1} |-> (b12185 - b12185)])] = (-([b12186 \in {2, 1, 3} |-> 3])[(-0)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07893 failed.
    2181:0 Attempted to compute cardinality of the value
    (0 :> 0 @@ 1 :> 0)
---*)
