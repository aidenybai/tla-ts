(*---
description: "A string first made at runtime gets the newest token and sorts after every source string."
ref: "util/UniqueString.java#concat"
flags: [expression]
outcome: success
---*)
---- MODULE runtime_string_last ----
EXTENDS Integers, Sequences, TLC
Test == PrintT({"zzp" \o "zzq", "zzr"})
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"zzr", "zzpzzq"}'
---*)
