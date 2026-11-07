(*---
description: Evaluates a random record expression, seed 262, number 6680.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06680 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(-1 :> -1) EXCEPT ![Len(<<>>)] = IF TRUE THEN 0 ELSE 2] EXCEPT ![(LET b10241 == -1 IN b10241 * (2 * 2147483647))] = ((3 % 3) % (-3))] EXCEPT !.a = @ + (LET b10242 == Len(FALSE) IN ([a |-> 1, b |-> TRUE]).a + ((<<5, 6>> @@ FALSE))[CASE FALSE -> 2 [] OTHER -> 2])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 27 of module random_06680
    2178:0 Overflow when computing 2*2147483647
    2178:0 Overflow when computing 2*2147483647
---*)
