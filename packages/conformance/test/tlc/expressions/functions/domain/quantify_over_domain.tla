(*---
description: "A quantifier over a DOMAIN sees each key in order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_domain"
flags: [expression]
outcome: success
---*)
---- MODULE quantify_over_domain ----
EXTENDS Integers
Test == \A i \in DOMAIN <<1, 2>> : <<1, 2>>[i] = i
====

(*--- recorded
all:
  exit: 0
---*)
