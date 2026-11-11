(*---
description: Evaluates a random function expression, seed 262, number 2732.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02732 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE) :> Head(<<1, 2>>)) EXCEPT ![(Len(<<3, 1, 2>>) * (<<1, 2>>)[0])] = (Head(<<1>>) - IF FALSE THEN 2 ELSE 1)] EXCEPT ![(((2 % 3) * CASE TRUE -> 7 [] OTHER -> 1) % IF (FALSE \/ TRUE) THEN (FALSE + 3) ELSE Len(<<3, 1, 2>>))] = ([[a |-> 7, b |-> TRUE] EXCEPT !.a = CASE TRUE -> 7 [] OTHER -> 2147483647])[(([x \in Nat |-> x + 1] @@ (1 :> 2)))[Head(<<3, 1, 2>>)]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02732 failed.
    Attempted to access index 0 of tuple
    <<1, 2>>
    which is out of bounds.
---*)
