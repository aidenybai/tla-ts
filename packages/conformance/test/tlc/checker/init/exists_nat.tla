(*---
description: "\\E v \\in Nat: is an error, because Nat is not enumerable, and its message explains why."
ref: tlc2/tool/impl/Tool.java#contexts
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE exists_nat ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == \E v \in Nat : x = v
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 TLC encountered the non-enumerable quantifier bound
    Nat
    line 13, col 18 to line 13, col 20 of module exists_nat
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 28 in exists_nat
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
