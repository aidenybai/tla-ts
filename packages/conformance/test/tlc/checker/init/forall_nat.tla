(*---
description: "\\A v \\in Nat: in Init cannot enumerate its domain."
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_bf
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE forall_nat ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x = 1 /\ \A v \in Nat : v >= 0
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 TLC encountered the non-enumerable quantifier bound
    Nat
    line 13, col 27 to line 13, col 29 of module forall_nat
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 38 in forall_nat
    1. Line 13, column 9 to line 13, column 13 in forall_nat
    2. Line 13, column 18 to line 13, column 38 in forall_nat
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
