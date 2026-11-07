(*---
description: Evaluates a random function expression, seed 262, number 4539.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04539 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE) EXCEPT ![(([x \in 1..2 |-> x])[1] - Len(<<1>>))] = (CHOOSE b7122 \in DOMAIN [x \in Nat |-> x + 1] : (SUBSET {1} \subseteq {1, 2}))] EXCEPT ![([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] EXCEPT !.a = (2 * 0)]).a] = (Len(Append(<<1, 2>>, 2147483647)) \div ((-2147483647) - ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 68 of module random_04539
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 201 of module random_04539
    | (2 :> 0)
---*)
