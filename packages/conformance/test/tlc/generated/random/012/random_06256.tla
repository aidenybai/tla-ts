(*---
description: Evaluates a random bool expression, seed 262, number 6256.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06256 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((\E b9640 \in {} : FALSE) \/ (\A b9641 \in 2..1 : TRUE)) <=> (([a |-> 1, b |-> TRUE]).a \in Head(<<1>>))) \/ ([(CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) EXCEPT ![CASE FALSE -> 2147483647 [] OTHER -> 3] = (2147483647 % 2)] @@ (Cardinality(SUBSET {1}) :> (2147483647 % 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06256 failed.
    Attempted to check if the value:
    1
    is an element of the integer 1
---*)
