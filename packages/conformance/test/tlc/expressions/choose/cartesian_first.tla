(*---
description: "CHOOSE over S \\X T picks the lexicographically smallest tuple."
ref: "tlc2/tool/impl/Tool.java#OPCODE_bc"
flags: [expression]
outcome: success
---*)
---- MODULE cartesian_first ----
EXTENDS Integers
Test == (CHOOSE t \in {2, 1} \X {4, 3} : TRUE) = <<1, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
