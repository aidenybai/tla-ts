(*---
description: Evaluates a random set expression, seed 262, number 7054.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07054 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b10826 \in DOMAIN [(CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE) EXCEPT ![CASE TRUE -> 1 [] OTHER -> 2] = (0 + 1)] : ((\A b10827 \in (2 .. b10826) : (\E b10828 \in {2, 1, 3} : TRUE)) \/ ((CHOOSE b10829 \in {1} : FALSE) = Head(<<1>>)))})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 37 to line 14, col 81 of module random_07054
    | {2}
---*)
