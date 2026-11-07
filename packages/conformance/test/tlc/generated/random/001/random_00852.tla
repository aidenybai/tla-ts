(*---
description: Evaluates a random record expression, seed 262, number 852.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00852 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> IF TRUE THEN 2147483647 ELSE 7, b |-> ({1, 2} \subseteq {1})] EXCEPT !.a = @ + ((-1 + 3) - ([a |-> 1, b |-> TRUE]).a)] EXCEPT !.a = (((-1 \div 2147483647) * SelectSeq(<<1>>, LAMBDA e : e > 0)) % (CHOOSE b1390 \in (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) : (FALSE <=> TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
