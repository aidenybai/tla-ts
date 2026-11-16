(*---
description: div_dividend applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Naturals.java#Divide
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE div_dividend_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 :> 2 \div 2)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
