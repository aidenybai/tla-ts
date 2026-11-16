(*---
description: colon_greater of string_a, a StringValue, and nat, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_string_a__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") :> (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> Nat]"
---*)
