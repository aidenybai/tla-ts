(*---
description: "A string built at runtime finds a key spelled in the source."
ref: "tlc2/value/impl/FcnRcdValue.java#select"
flags: [expression]
outcome: success
---*)
---- MODULE runtime_string_key ----
EXTENDS Integers, Sequences
F == [s \in {"ab"} |-> 7]
Test == F["a" \o "b"] = 7
====

(*--- recorded
all:
  exit: 0
---*)
