(*---
description: "A concatenated string equals the same spelling in the source, because all strings are interned."
ref: "util/UniqueString.java#concat"
flags: [expression]
outcome: success
---*)
---- MODULE runtime_concat_is_same_string ----
EXTENDS Integers, Sequences, FiniteSets
Test == "a" \o "b" = "ab" /\ Cardinality({"a" \o "b", "ab"}) = 1
====

(*--- recorded
all:
  exit: 0
---*)
