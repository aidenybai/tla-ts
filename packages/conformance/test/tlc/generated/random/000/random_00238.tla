(*---
description: Evaluates a random function expression, seed 262, number 238.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00238 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b391 \in (DOMAIN ([a |-> 1] :> -1) \cup {Cardinality({}) : b392 \in ({} \ {1, 2})}) |-> (CHOOSE b393 \in {((1 :> 2))[b391], (1 * <<1, 2>>)} : (\E b394 \in DOMAIN [x \in Nat |-> x + 1] : (SUBSET {1} \subseteq Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00238 failed.
    Attempted to check equality of integer 1 with non-integer:
    [a |-> 1]
---*)
