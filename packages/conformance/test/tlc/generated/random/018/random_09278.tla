(*---
description: Evaluates a random seq expression, seed 262, number 9278.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09278 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq([Append(<<1, 2>>, 0) EXCEPT ![1] = (-1 * 3)], (Cardinality(Nat) % (1 - 3)), (<<2, 2147483647>> + LET b14402 == 3 IN b14402)), (CHOOSE b14403 \in (<<1, 3>> \cup (TRUE /\ FALSE)) : (\A b14404 \in DOMAIN <<5, 6>> : ({} \subseteq <<1>>))), IF ([FALSE EXCEPT !.a = @ + 3] = [[a |-> 1] EXCEPT !.a = @ + 2147483647]) THEN Len(SubSeq(<<3, 1, 2>>, 1, 0)) ELSE ((1 - 3) * (-1 % 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
