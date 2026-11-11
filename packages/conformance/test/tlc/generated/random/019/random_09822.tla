(*---
description: Evaluates a random record expression, seed 262, number 9822.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09822 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b15248 == IF TRUE THEN 3 ELSE 2 IN ([a |-> 1, b |-> TRUE]).a, b |-> ((FALSE \/ TRUE) => (FALSE <=> TRUE))] EXCEPT !.a = CASE ((~TRUE) <=> (SUBSET {1} = {1, 2})) -> ((CHOOSE b15249 \in 2..1 : <<>>) % (-7)) [] OTHER -> (Cardinality(Nat) - Cardinality(2..1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09822 failed.
    Attempted to check equality of the set {} with the value:
    1
---*)
