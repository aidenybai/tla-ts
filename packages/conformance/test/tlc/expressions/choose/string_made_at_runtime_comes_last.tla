(*---
description: "A string first seen at run time, such as a concatenation, sorts after every string in the source."
ref: "util/UniqueString.java#concat"
flags: [expression]
outcome: success
---*)
---- MODULE string_made_at_runtime_comes_last ----
EXTENDS Integers, Sequences
Test == (CHOOSE x \in {"zzb" \o "zzc", "zzd"} : TRUE) = "zzd"
====

(*--- recorded
all:
  exit: 0
---*)
