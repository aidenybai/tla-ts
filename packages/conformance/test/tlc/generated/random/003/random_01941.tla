(*---
description: Evaluates a random bool expression, seed 262, number 1941.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01941 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b3056 \in ({(b3057 + b3057) : b3057 \in ({2, 1, 3} \cup Nat)} \cap DOMAIN (CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE)) : (((b3056 - b3056) % (CHOOSE b3058 \in SUBSET {1} : TRUE)) \in [[[a |-> 1, b |-> TRUE] EXCEPT !.a = b3056] EXCEPT !.a = @ + (-[x \in Nat |-> x + 1])])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01941 failed.
    Attempted to enumerate S \cup T when S:
    {1, 2, 3}
    and T:
    Nat
    are not both enumerable
---*)
