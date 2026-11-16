(*---
description: Evaluates a random function expression, seed 262, number 3905.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03905 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a :> (Head(<<1, 2>>) + LET b6149 == 2 IN b6149)) @@ [[b6150 \in ({x \in 1..3 : x > 1} \cap {}) |-> (CHOOSE b6151 \in 1..3 : FALSE)] EXCEPT ![((7 % 2147483647) + (-0))] = (CHOOSE b6152 \in (2 .. -1) : ({1} \subseteq SUBSET {1}))]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 114 to line 14, col 191 of module random_03905
    | (2 :> 3)
---*)
