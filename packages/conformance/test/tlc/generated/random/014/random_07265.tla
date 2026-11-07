(*---
description: Evaluates a random set expression, seed 262, number 7265.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07265 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((TRUE /\ TRUE) /\ (0 \in {2, 1, 3})) -> LET b11181 == (CHOOSE b11182 \in SUBSET {1} : [a |-> 1, b |-> TRUE]) IN (b11181 % b11181) [] OTHER -> Cardinality(({1, 2} \ SUBSET {1})), (CHOOSE b11183 \in UNION {(2..1 \ {2, 1, 3}), UNION {1..3, Nat}} : ([<<1, 2>> EXCEPT ![1] = 2] = ((1 :> 2) @@ [x \in Nat |-> x + 1])))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07265 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
