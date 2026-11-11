(*---
description: subseteq of set_cap, a SetCapValue, and nat, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_cap__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) \subseteq (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
