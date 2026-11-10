(*---
description: "STRING holds every string."
ref: "tlc2/module/Strings.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE in_string_set ----
EXTENDS Integers, Sequences
Test == "" \in STRING /\ "a" \o "b" \in STRING
====

(*--- recorded
all:
  exit: 0
---*)
