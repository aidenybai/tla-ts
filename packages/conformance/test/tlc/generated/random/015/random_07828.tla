(*---
description: Evaluates a random set expression, seed 262, number 7828.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07828 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = IF (<<>> = [x \in Nat |-> x + 1]) THEN IF FALSE THEN 0 ELSE 1 ELSE ([a |-> 1, b |-> TRUE]).a] .. IF ((TRUE /\ FALSE) <=> (1 \subseteq {2, 1, 3})) THEN (CHOOSE b12091 \in {b12092 \in Nat : TRUE} : (\A b12093 \in Nat : FALSE)) ELSE (CHOOSE b12094 \in ({} \ {2, 1, 3}) : (0 = [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07828 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
