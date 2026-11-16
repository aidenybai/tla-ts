(*---
description: interval_high applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Naturals.java#DotDot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE interval_high_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 .. 1 :> 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1..1 :> 2)"
---*)
