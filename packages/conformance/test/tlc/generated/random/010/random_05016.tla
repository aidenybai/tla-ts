(*---
description: Evaluates a random record expression, seed 262, number 5016.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05016 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> IF ({} = Nat) THEN (-0) ELSE (2147483647 = -1), b |-> ((SUBSET {1} \cup SUBSET {1}) \subseteq UNION {<<3, 1, 2>>, 2..1})] EXCEPT !.a = ((-(1 % 7)) - ((-0) % ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05016 failed.
    Attempted to check equality of the set {} with the value:
    Nat
---*)
