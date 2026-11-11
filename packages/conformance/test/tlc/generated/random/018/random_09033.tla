(*---
description: Evaluates a random set expression, seed 262, number 9033.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09033 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((CHOOSE b14032 \in SUBSET {1} : TRUE) * (b14031 * 7)) - Cardinality({2147483647, [a |-> 1]})) : b14031 \in ((DOMAIN [x \in Nat |-> x + 1] \cup (~TRUE)) \ UNION {UNION {1..3, Nat}, ({1, 2} \cap {2, 1, 3})})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09033 failed.
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    FALSE
    are not both enumerable
---*)
