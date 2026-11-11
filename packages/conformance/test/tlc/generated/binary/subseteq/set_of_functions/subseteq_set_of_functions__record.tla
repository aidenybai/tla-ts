(*---
description: subseteq of set_of_functions, a SetOfFcnsValue, and record, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_of_functions__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) \subseteq ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseteq_set_of_functions__record failed.
    Attempted to check if element:
    <<2>>
    is in the record:
    [a |-> 1, b |-> 2]
---*)
