(*---
description: Evaluates a random record expression, seed 262, number 8650.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08650 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + IF (2..1 = [a |-> 1]) THEN Cardinality(SUBSET {1}) ELSE Cardinality(Nat)] EXCEPT !.a = Len(Tail((<<1>> \o <<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08650 failed.
    Attempted to check equality of the set {} with the value:
    [a |-> 1]
---*)
