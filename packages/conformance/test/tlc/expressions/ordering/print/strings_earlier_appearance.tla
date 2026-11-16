(*---
description: "A string that appears earlier in the module sorts first, even when written second in the set."
ref: "util/UniqueString.java#compareTo"
flags: [expression]
outcome: success
---*)
---- MODULE strings_earlier_appearance ----
EXTENDS Integers, TLC
First == "zza"
Test == PrintT({"zzb", "zza"})
====

(*--- recorded
all:
  exit: 0
  transcript: '| {"zza", "zzb"}'
---*)
