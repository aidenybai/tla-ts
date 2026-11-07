(*---
description: Evaluates a random bool expression, seed 262, number 6294.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06294 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\E b9678 \in ({-1, 1} \cup (2..1 \cap SUBSET {1})) : ({b9679 \in {1, 2} : FALSE} \subseteq (Nat \ 1..3))) THEN (([[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 7] @@ [b9680 \in Nat |-> b9680]))[((CHOOSE f \in [{} -> {2, 1, 3}] : TRUE))[IF TRUE THEN 0 ELSE 2]] ELSE Len(SubSeq(SelectSeq(<<>>, LAMBDA e : e > 0), IF [a |-> 1] THEN 0 ELSE -1, (0 * 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
