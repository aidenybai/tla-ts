(*---
description: Evaluates a random function expression, seed 262, number 8881.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08881 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13755 \in (((2..1 \cap Nat) \ ({1} \cap {})) \ DOMAIN [[x \in 1..2 |-> x] EXCEPT ![2147483647] = 2147483647]) |-> (\A b13756 \in {b13757 \in {2147483647, b13755} : (\E b13758 \in SUBSET {1} : TRUE)} : (CASE SUBSET {1} -> -1 [] OTHER -> 0 < (-1 - b13755)))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 73 to line 14, col 90 of module random_08881
    | <<>>
---*)
