(*---
description: Print's first argument may have any type, and both print through ppr.
ref: tlc2/module/TLC.java#Print
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE print_values_in_any_form ----
EXTENDS TLC, Naturals
Test == Print(<<1>>, [a |-> {2}]) = [a |-> {2}]
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>  [a |-> {2}]"
---*)
