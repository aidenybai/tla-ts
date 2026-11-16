(*---
description: \E over Nat inside a conjunction fails during generation.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch OPCODE_be
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE exists_nat_in_conjunction ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == (\E i \in Nat : x' = i) /\ y' = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : TLC encountered the non-enumerable quantifier bound
    Nat
    line 13, col 19 to line 13, col 21 of module exists_nat_in_conjunction
    The set Nat contains infinitely many elements. As a result, TLC cannot evaluate expressions that
    universally (\A) or existentially (\E) quantify over Nat, because this would require checking an
    infinite number of cases. Note that TLC handles set membership like T \subseteq Nat for any finite set T.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 41 in exists_nat_in_conjunction
    1. Line 13, column 10 to line 13, column 30 in exists_nat_in_conjunction
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
