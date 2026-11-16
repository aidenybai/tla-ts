(*---
description: interval_low applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Naturals.java#DotDot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE interval_low_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 :> 2 .. 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2..2>>"
---*)
