(*---
description: "\\o concatenates strings."
ref: "tlc2/module/Sequences.java#Concat"
flags: [expression]
outcome: success
---*)
---- MODULE concat ----
EXTENDS Integers, Sequences
Test == "ab" \o "cd" = "abcd" /\ "" \o "" = ""
====

(*--- recorded
all:
  exit: 0
---*)
