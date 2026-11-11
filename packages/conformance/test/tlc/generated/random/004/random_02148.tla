(*---
description: Evaluates a random set expression, seed 262, number 2148.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02148 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ({b3395 : b3395 \in {1}} = (Nat \ {x \in 1..3 : x > 1})) -> Cardinality({3, 1}) [] OTHER -> ((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE))[Head(<<>>)], (([b3396 \in {} |-> b3396])[([a |-> 1]).a] \div ((CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE))[([x \in Nat |-> x + 1])[-1]])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02148 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
