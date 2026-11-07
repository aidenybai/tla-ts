(*---
description: Evaluates a random record expression, seed 262, number 1582.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01582 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + (0 + 2)] EXCEPT !.a = ((7 - 0) * LET b2524 == 7 IN 7)] EXCEPT !.a = LET b2525 == Head([<<>> EXCEPT ![1] = 3]) IN (Head(<<1, 2>>) + ([x \in Nat |-> x + 1])[b2525])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 164 to line 14, col 167 of module random_01582
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
