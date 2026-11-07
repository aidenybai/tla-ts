(*---
description: Evaluates a random function expression, seed 262, number 362.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00362 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Len([x \in 1..2 |-> x]) @@ [b595 \in SUBSET {1} |-> 2147483647]) @@ [(CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE) EXCEPT ![Len(<<>>)] = IF TRUE THEN 7 ELSE 2]) EXCEPT ![(CHOOSE r \in [a : 1..2] : TRUE)] = (([[x \in Nat |-> x + 1] EXCEPT ![0] = -1])[LET b596 == 3 IN b596] - Head(Tail(<<1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of @@ should be a function, but instead it is:
    2
    2169:0 The first argument of @@ should be a function, but instead it is:
    2
---*)
