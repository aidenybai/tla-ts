(*---
description: Evaluates a random record expression, seed 262, number 3294.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03294 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = (IF ({2, 1, 3} = Nat) THEN (CHOOSE b5236 \in SUBSET {1} : TRUE) ELSE CASE FALSE -> 1 [] OTHER -> 0 % LET b5237 == Cardinality(SUBSET {1}) IN (b5237 % 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03294 failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    Nat
---*)
