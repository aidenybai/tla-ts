(*---
description: PrintT(STRING) prints STRING.
ref: tlc2/module/Strings.java#toString
features:
  - Strings
flags:
  - expression
outcome: success
---*)
---- MODULE prints_name ----
EXTENDS TLC
Test == PrintT(STRING)
====

(*--- recorded
all:
  exit: 0
  transcript: "| STRING"
---*)
