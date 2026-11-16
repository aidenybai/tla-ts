(*---
description: ENABLED of \E over Nat fails with the quantifier bound message.
ref: tlc2/tool/impl/Tool.java#enabledApplImpl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE exists_nat ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x
Inv == PrintT(ENABLED (\E i \in Nat : x' = i))
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 TLC encountered the non-enumerable quantifier bound
    Nat
    line 15, col 33 to line 15, col 35 of module exists_nat
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    While working on the initial state:
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 13 in exists_nat
    1. Line 15, column 8 to line 15, column 46 in exists_nat
    2. Line 15, column 15 to line 15, column 45 in exists_nat
    3. Line 15, column 24 to line 15, column 44 in exists_nat
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
