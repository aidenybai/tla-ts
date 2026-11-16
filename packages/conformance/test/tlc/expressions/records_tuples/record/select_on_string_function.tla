(*---
description: "r.a works on a function whose keys are strings."
ref: "tlc2/tool/impl/Tool.java#OPCODE_rs"
flags: [expression]
outcome: success
---*)
---- MODULE select_on_string_function ----
EXTENDS Integers, TLC
Test == ("a" :> 1).a = 1 /\ [x \in {"a"} |-> 1].a = 1
====

(*--- recorded
all:
  exit: 0
---*)
