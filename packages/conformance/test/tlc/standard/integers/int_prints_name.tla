(*---
description: PrintT(Int) prints Int.
ref: tlc2/module/Integers.java#toString
features:
  - Integers
flags:
  - expression
outcome: success
---*)
---- MODULE int_prints_name ----
EXTENDS Integers, TLC
Test == PrintT(Int)
====

(*--- recorded
all:
  exit: 0
  transcript: "| Int"
---*)
